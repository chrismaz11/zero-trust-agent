import inquirer from 'inquirer';
import ora from 'ora';
import pc from 'picocolors';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

import { analyzeAgent } from './ai.js';
import { printMonetizationPitch, generateRegistrationLink } from './cloud.js';
import { writeConfigFiles } from './config-generator.js';

// Load environment variables from .env
dotenv.config();

/**
 * Renders the ZTA CLI Welcome Banner
 */
function printWelcomeBanner() {
  console.log(pc.cyan(`
 🛡️  Z E R O  -  T R U S T  -  A G E N T
 ═════════════════════════════════════
  Interactive AI Setup & Onboarding CLI
  `));
  console.log(pc.dim('  This tool walks you through establishing governance boundaries,'));
  console.log(pc.dim('  defining security tiers, and generating audit-ready configurations.'));
  console.log('  ─────────────────────────────────────────────────────────────\n');
}

/**
 * Main wizard function
 */
export async function runWizard() {
  printWelcomeBanner();

  // Step 1: User Identity and Agent Info
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'agentName',
      message: 'What is the name of your AI Agent?',
      default: 'SupportCoordinator',
      validate: (input) => input.trim() !== '' ? true : 'Agent name is required.'
    },
    {
      type: 'input',
      name: 'owner',
      message: 'Who is the owner or responsible team?',
      default: 'Security-Ops',
      validate: (input) => input.trim() !== '' ? true : 'Owner/Team is required.'
    },
    {
      type: 'input',
      name: 'purpose',
      message: 'Describe your agent\'s purpose (e.g. what does it do?):',
      default: 'Reviews client emails, checks ticket history, and recommends answers.',
      validate: (input) => input.trim() !== '' ? true : 'Agent purpose is required.'
    },
    {
      type: 'input',
      name: 'systems',
      message: 'List the databases, APIs, or systems this agent connects to (comma separated):',
      default: 'Zendesk API, Customer SQL Database, SendGrid API'
    }
  ]);

  console.log('\n' + pc.bold(pc.blue('🧠 Active AI security assessment in progress...')));
  
  // Check API Key
  const apiCheck = process.env.GEMINI_API_KEY 
    ? pc.green('Using Gemini API key from environment.')
    : pc.yellow('No GEMINI_API_KEY found. Using ZTA Cloud Onboarding Gateway (offline fallback rules).');
  console.log(pc.dim(`  [AI Gateway]: ${apiCheck}`));

  const spinner = ora('Analyzing security boundaries, permissions, and threat models...').start();
  
  // Call AI analysis
  let aiRecommendation;
  try {
    aiRecommendation = await analyzeAgent(answers.purpose, answers.systems);
    spinner.succeed('AI Analysis Complete!');
  } catch (error) {
    spinner.fail('AI Analysis encountered an error.');
    console.error(pc.red(error));
    process.exit(1);
  }

  // Display AI Recommendation
  console.log('\n' + pc.green('═════════════════════════════════════════════════════════════'));
  console.log(pc.bold(pc.green(`🛡️  RECOMMENDED TRUST TIER: ${aiRecommendation.tier}`)));
  console.log(pc.green('═════════════════════════════════════════════════════════════'));
  
  console.log(`\n${pc.bold('AI Security Rationale:')}`);
  console.log(pc.cyan(aiRecommendation.rationale));

  console.log(`\n${pc.bold('Recommended Permission Scopes:')}`);
  console.log(`  ${pc.bold('Read Access:')}    [ ${aiRecommendation.readPermissions.map(p => pc.green(p)).join(', ')} ]`);
  console.log(`  ${pc.bold('Draft/Write:')}  [ ${aiRecommendation.writePermissions.map(p => pc.yellow(p)).join(', ')} ]`);
  console.log(`  ${pc.bold('Forbidden:')}    [ ${aiRecommendation.forbiddenActions.map(p => pc.red(p)).join(', ')} ]`);

  console.log(`\n${pc.bold('Recommended Guardrails:')}`);
  aiRecommendation.guardrails.forEach(g => console.log(`  ${pc.yellow('•')} ${g}`));

  console.log(`\n${pc.bold('Failure Mode Action:')}`);
  console.log(`  ${aiRecommendation.failureMode}`);

  console.log(`\n${pc.bold('Kill Switch Trigger:')}`);
  console.log(`  ${aiRecommendation.killSwitchTrigger}`);

  console.log(pc.green('─────────────────────────────────────────────────────────────'));

  // Tell the user the best response/guidelines for this specific trust tier
  console.log('\n' + pc.bold(pc.yellow('💡 ACTIVE AI SECURITY SUGGESTION & BEST RESPONSES:')));
  if (aiRecommendation.tier === 'T0') {
    console.log(pc.dim('  Since this agent is classified as T0 (Observer):'));
    console.log('  1. Enforce read-only database connections at the infrastructure level.');
    console.log('  2. Never provide write API tokens in environment variables.');
    console.log('  3. Best Response: "Confirm Tier T0 Observer. Keep code strictly passive."');
  } else if (aiRecommendation.tier === 'T1') {
    console.log(pc.dim('  Since this agent is classified as T1 (Drafter):'));
    console.log('  1. Maintain human-in-the-loop validation for all generated emails or mutations.');
    console.log('  2. Never let the agent trigger API actions without a cryptographic approval signature.');
    console.log('  3. Best Response: "Confirm Tier T1 Drafter. Enable approvals before execution."');
  } else {
    console.log(pc.dim(`  Since this agent is classified as ${aiRecommendation.tier} (Executor/Autonomous):`));
    console.log('  1. Maintain highly restricted execution methods with explicit parameter blocklists.');
    console.log('  2. Test the automated kill switch under simulated traffic spikes.');
    console.log('  3. Best Response: "Confirm execution scope. Keep active alerts active."');
  }

  // Ask if user wants to override/edit
  const customization = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'override',
      message: 'Would you like to customize these permission scopes or guardrails?',
      default: false
    }
  ]);

  let finalConfig = {
    name: answers.agentName,
    purpose: answers.purpose,
    owner: answers.owner,
    ...aiRecommendation
  };

  if (customization.override) {
    const customAnswers = await inquirer.prompt([
      {
        type: 'list',
        name: 'tier',
        message: 'Select Trust Tier:',
        choices: ['T0 (Observer)', 'T1 (Drafter)', 'T2 (Executor)', 'T3 (Autonomous)'],
        default: `${aiRecommendation.tier} (Draft-only or Passive)`
      },
      {
        type: 'input',
        name: 'readPermissions',
        message: 'Read Permissions (comma separated):',
        default: aiRecommendation.readPermissions.join(', ')
      },
      {
        type: 'input',
        name: 'writePermissions',
        message: 'Write/Draft Permissions (comma separated):',
        default: aiRecommendation.writePermissions.join(', ')
      },
      {
        type: 'input',
        name: 'forbiddenActions',
        message: 'Forbidden Actions (comma separated):',
        default: aiRecommendation.forbiddenActions.join(', ')
      }
    ]);

    // Parse customizations
    finalConfig.tier = customAnswers.tier.split(' ')[0];
    finalConfig.readPermissions = customAnswers.readPermissions.split(',').map(s => s.trim()).filter(Boolean);
    finalConfig.writePermissions = customAnswers.writePermissions.split(',').map(s => s.trim()).filter(Boolean);
    finalConfig.forbiddenActions = customAnswers.forbiddenActions.split(',').map(s => s.trim()).filter(Boolean);
  }

  // Step 2: Monetization Pitch (ZTA Cloud integration)
  printMonetizationPitch();

  const cloudChoice = await inquirer.prompt([
    {
      type: 'list',
      name: 'destination',
      message: 'Where should audit logs and approvals be directed?',
      choices: [
        {
          name: 'Local File & Manual Console Approvals (Open Source - $0/mo)',
          value: 'local'
        },
        {
          name: 'ZTA Cloud Team Central Control Plane & Slack Integration (Paid Subscription - $49/mo)',
          value: 'cloud'
        }
      ]
    }
  ]);

  if (cloudChoice.destination === 'cloud') {
    const { token, registerUrl } = generateRegistrationLink(finalConfig.name);
    finalConfig.cloudEnabled = true;
    finalConfig.cloudToken = token;
    finalConfig.cloudUrl = registerUrl;

    console.log('\n' + pc.bold(pc.yellow('👉 BRIDGE TO ZTA CLOUD:')));
    console.log(`  To link this agent setup to your live control plane, open the following URL:`);
    console.log(`  ${pc.bold(pc.underline(pc.cyan(registerUrl)))}`);
    console.log(`\n  This token is linked to your setup: ${pc.bold(token)}`);
    console.log(pc.dim('  This will enable cloud log streaming, Slack notifications, and the dashboard.'));

    await inquirer.prompt([
      {
        type: 'input',
        name: 'confirmCloud',
        message: 'Press [Enter] once you have opened or saved this registration link...'
      }
    ]);
  } else {
    finalConfig.cloudEnabled = false;
    console.log('\n' + pc.yellow('⚠️  Using local file logging. Please ensure your local file systems are secured.'));
  }

  // Step 3: File Generation
  const fileSpinner = ora('Writing governance files...').start();
  const outputDir = process.cwd();
  
  try {
    const files = writeConfigFiles(finalConfig, outputDir);
    fileSpinner.succeed('Governance Files Created successfully!');
    
    console.log('\n' + pc.bold('Generated Files:'));
    console.log(`  ${pc.green('✔')} Config File:  ${pc.cyan(path.relative(outputDir, files.yamlPath))}`);
    console.log(`  ${pc.green('✔')} Scope Doc:   ${pc.cyan(path.relative(outputDir, files.scopePath))}`);
    console.log(`  ${pc.green('✔')} System Prompt: ${pc.cyan(path.relative(outputDir, files.promptPath))}`);
  } catch (err) {
    fileSpinner.fail('Failed to write governance files.');
    console.error(pc.red(err));
    process.exit(1);
  }

  // Final Checklist
  console.log('\n' + pc.bold(pc.green('🚀 NEXT STEPS FOR DEPLOYMENT:')));
  console.log(`  1. Review the scope document (${pc.cyan('zta-scope.md')}) with your compliance officer.`);
  console.log(`  2. Supply ${pc.cyan('zta-system-prompt.txt')} to your LLM orchestration system as the system instruction.`);
  console.log(`  3. Integrate audit logging into your codebase using the schema in ${pc.cyan('zta-config.yaml')}.`);
  console.log(`  4. Validate your local kill switch by running a manual SIGTERM test.`);
  
  if (finalConfig.cloudEnabled) {
    console.log(`  5. Verify your active log stream inside the ZTA Cloud dashboard: ${pc.cyan('https://zta.dev/dashboard')}`);
  }
  
  console.log('\n' + pc.bold(pc.green('🛡️  Happy and Safe Agent Orchestration!')) + '\n');
}
