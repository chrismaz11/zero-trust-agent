import pc from 'picocolors';

export const SAAS_TIERS = {
  free: {
    name: 'ZTA Developer (Open Source)',
    price: '$0/mo',
    features: [
      'Local CLI configuration generator',
      'Local file-based JSONL audit logging',
      'Local command-line action approvals',
      'Basic system prompt skeleton generator'
    ]
  },
  cloud: {
    name: 'ZTA Cloud Team',
    price: '$49/mo per agent',
    features: [
      'Centralized, cryptographically-signed immutable audit log store',
      'Real-time Slack / MS Teams / Email approval notifications with active buttons',
      'Web dashboard for managing all agent states, permission maps, and telemetry',
      'Real-time heartbeat monitoring with automatic SMS alerts when agents fail',
      'SOC 2 and GDPR compliance audit export reports'
    ]
  },
  enterprise: {
    name: 'ZTA Enterprise',
    price: 'Custom pricing',
    features: [
      'Multi-tenant dashboard with SSO / SAML integration',
      'Role-Based Access Control (RBAC) approval workflows',
      'Custom database adapters (Postgres, DynamoDB, Datadog, Splunk) for audit logs',
      'Dedicated compliance and security engineering support (24/7 SLA)',
      'Custom threat-model scanning and policy violation warnings'
    ]
  }
};

/**
 * Generates a mock registration token and URL to link the local CLI session to ZTA Cloud.
 */
export function generateRegistrationLink(agentName) {
  const randomBytes = Array.from({ length: 8 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  const token = `cli_trial_${randomBytes}`;
  const registerUrl = `https://zta.dev/register?token=${token}&agent=${encodeURIComponent(agentName)}`;
  
  return {
    token,
    registerUrl
  };
}

/**
 * Prints a beautiful summary of the monetization options and pricing plans.
 */
export function printMonetizationPitch() {
  console.log('\n' + pc.bold(pc.cyan('⚡ MONETIZE & GOVERN: ZTA CLOUD INTEGRATION')));
  console.log(pc.dim('The Zero-Trust Agent Framework is 100% open source under the MIT license.'));
  console.log(pc.dim('ZTA Cloud is our optional hosted platform designed to simplify production operations.'));
  console.log('\n' + pc.bold('Available Options:'));

  // Option 1: Free
  console.log(`\n  ${pc.bold(pc.green('1. ' + SAAS_TIERS.free.name))} (${pc.bold(SAAS_TIERS.free.price)})`);
  SAAS_TIERS.free.features.forEach(f => console.log(`     - ${f}`));

  // Option 2: Cloud (Monetization focus)
  console.log(`\n  ${pc.bold(pc.yellow('2. ' + SAAS_TIERS.cloud.name))} (${pc.bold(SAAS_TIERS.cloud.price)}) ${pc.bgYellow(pc.black(' RECOMMENDED '))}`);
  SAAS_TIERS.cloud.features.forEach(f => console.log(`     - ${f}`));

  // Option 3: Enterprise
  console.log(`\n  ${pc.bold(pc.magenta('3. ' + SAAS_TIERS.enterprise.name))} (${pc.bold(SAAS_TIERS.enterprise.price)})`);
  SAAS_TIERS.enterprise.features.forEach(f => console.log(`     - ${f}`));
  console.log('');
}
