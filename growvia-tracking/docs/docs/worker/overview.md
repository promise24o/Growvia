---
sidebar_position: 1
title: Worker Service
---

# Background Worker Service

Processes asynchronous tasks for analytics, payouts, and notifications.

## Features

- **Analytics Aggregation** - Daily metrics calculation
- **Payout Processing** - Automated affiliate payouts
- **Email Notifications** - Conversion alerts and reports
- **Data Cleanup** - Archive old events and sessions
- **Fraud Analysis** - ML-powered fraud detection

## Setup

```bash
cd apps/worker
cp .env.example .env
npm install
npm run dev
```

## Job Queues

### Analytics Queue
Aggregates daily metrics for campaigns and affiliates.

### Payout Queue
Processes pending payouts for validated conversions.

### Email Queue
Sends notifications to affiliates and organizations.

### Cleanup Queue
Archives old data and removes expired sessions.

### Fraud Analysis Queue
Runs ML models on suspicious conversions.

## Cron Jobs

- **Daily Analytics**: Midnight (0 0 * * *)
- **Payout Processing**: 2 AM (0 2 * * *)
- **Data Cleanup**: 3 AM (0 3 * * *)
- **Fraud Analysis**: Hourly (0 * * * *)
