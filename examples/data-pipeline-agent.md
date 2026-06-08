# Example: Data Pipeline Agent

> A T2 agent that manages ETL pipelines — monitors data freshness, auto-retries failed jobs, detects data quality issues, and escalates anomalies for human review.

---

## Agent Scope

| Field | Value |
|-------|-------|
| **Agent ID** | `data-pipeline-agent-prod` |
| **Tier** | T2 (Executor) — auto-retries and standard remediation; anomalies escalate |
| **Purpose** | Monitor and maintain data pipelines: detect failures, auto-retry with backoff, validate data quality, and escalate anomalies |
| **Owner** | Data Engineering Lead |

## What This Agent Does

1. **Monitors pipeline health** — Tracks every scheduled ETL job for completion, timing, and row counts
2. **Auto-retries failures** — When a job fails with a known transient error (timeout, rate limit, connection reset), automatically retries with exponential backoff (max 3 retries)
3. **Validates data quality** — After each successful run, checks row counts, null rates, schema consistency, and value distributions against historical baselines
4. **Detects anomalies** — Flags unusual patterns: unexpected row count changes (>30% deviation), new null columns, schema drift, value distribution shifts
5. **Escalates unknowns** — Any failure the agent can't auto-resolve or any data anomaly above threshold is escalated to the data engineering team with full context

## Permissions

```yaml
permissions:
  read:
    - pipeline_orchestrator   # Airflow/Dagster/Prefect job status
    - data_warehouse          # row counts, schema, freshness timestamps
    - pipeline_logs           # error logs, execution logs
    - monitoring_metrics      # pipeline latency, resource usage
  draft:
    - slack_alert             # anomaly and failure alerts
    - incident_report         # structured incident summaries
    - pipeline_config_change  # proposed config adjustments (requires approval)
  execute:
    - job_retry               # retry failed jobs (auto-approved for transient errors)
    - slack_notification      # informational status updates
    - quality_report          # auto-generate weekly quality reports
```

## Guardrails

```yaml
guardrails:
  retry_rules:
    max_retries: 3
    backoff: exponential     # 1min, 5min, 15min
    retryable_errors:
      - "connection_timeout"
      - "rate_limit_exceeded"
      - "temporary_unavailable"
      - "lock_wait_timeout"
    non_retryable_errors:    # these always escalate
      - "schema_mismatch"
      - "permission_denied"
      - "data_corruption"
      - "out_of_memory"
  
  quality_thresholds:
    row_count_deviation: 0.30      # >30% change from baseline → flag
    null_rate_increase: 0.10       # >10% increase in nulls → flag
    schema_change: any             # any new/missing column → flag
    freshness_sla: 2h              # data older than 2 hours → alert
  
  modification_rules:
    - never_delete_data            # agent cannot drop tables or delete rows
    - never_modify_schema          # schema changes require human approval
    - never_change_credentials     # credential updates are manual only
    - max_concurrent_retries: 5    # circuit breaker for retry storms
```

## Proactive Watchers

```yaml
watchers:
  - name: pipeline_health
    data_source: pipeline_orchestrator
    poll_interval: 60  # check every minute
    detection:
      - rule: "job_status == failed"
        action: auto_retry_if_transient
      - rule: "job_duration > 3x historical_average"
        action: alert_slow_job
      - rule: "no_job_completion in expected_window"
        action: alert_missing_run
    priority_map:
      failed_non_retryable: P1
      failed_after_max_retries: P1
      slow_job: P2
      missing_run: P1

  - name: data_quality
    data_source: data_warehouse
    trigger: on_job_completion
    detection:
      - check: row_count_vs_baseline
      - check: null_rate_vs_baseline
      - check: schema_consistency
      - check: value_distribution
    recommendation: "Flag anomalies with specific columns/tables affected"
    delivery: slack_alert
    channel: "#data-quality"

  - name: capacity_monitor
    data_source: monitoring_metrics
    schedule: "0 8 * * 1-5"  # weekday mornings
    detection:
      - rule: "storage_usage > 80% of allocated"
      - rule: "query_latency trending up over 7 days"
    recommendation: "Capacity planning alert with projected timeline"
    delivery: slack_message
    channel: "#data-engineering"
    priority: P2
```

## Kill Switch

```
Endpoint: POST /api/agents/data-pipeline-agent-prod/kill
Triggers:
  - Manual: Data engineering lead
  - Automatic: 5+ consecutive retry failures (retry storm detection)
  - Automatic: Agent triggers retry on non-retryable error (logic bug)
Action: Suspend all retries, stop all watchers, alert team, await manual review
```

## Why T2 Is the Right Tier

Pipeline operations are highly repetitive and well-understood. Auto-retrying a failed job with exponential backoff is a mechanical operation that humans shouldn't need to approve every time. However, the agent should never modify data, change schemas, or make infrastructure decisions without human review.

**T2 auto-approved actions:**
- Retry jobs with transient errors (up to 3x)
- Post status updates to Slack
- Generate quality reports

**Requires human approval:**
- Pipeline configuration changes
- Infrastructure scaling recommendations
- Any action after max retries exhausted
- Data anomaly remediation
