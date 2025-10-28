---
sidebar_position: 1
title: CLI Overview
---

# Growvia CLI

Command-line tools for managing your Growvia tracking system.

## Installation

```bash
npm install -g @growvia/cli
```

## Usage

```bash
growvia [command] [options]
```

## Available Commands

### Campaign Management
```bash
growvia campaign list
growvia campaign create
growvia campaign stats <campaignId>
```

### Affiliate Management
```bash
growvia affiliate list
growvia affiliate performance <affiliateId>
```

### Analytics
```bash
growvia analytics summary --days 30
growvia analytics top-affiliates --limit 10
```

### Setup
```bash
growvia setup init
growvia setup db
growvia setup test
```

## Configuration

Set environment variables in `.env`:

```env
MONGODB_URI=mongodb://localhost:27017/growvia
REDIS_HOST=localhost
REDIS_PORT=6379
```
