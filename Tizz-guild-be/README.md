## Name

Tizz Guild Be

## Overview

The Tizz Guild API offers a platform for managing user and guild interactions within a the Tizz echosystem, providing comprehensive tools for user authentication, guild management, and event handling.

### Function List

- **AppController_getHello**
  - Basic health check endpoint.

#### User Functions

- **UserController_auth**
  - Authenticate and/or register a user using a wallet address and signature.
- **UserController_refreshToken**
  - Refresh user authentication token.
- **UserController_updateUser**
  - Update user data and profile picture.
- **UserController_users**
  - Retrieve all users with pagination.
- **UserController_getUser**
  - Retrieve comprehensive user data including guild memberships.
- **UserController_getUserbyID**
  - Fetch user details by user ID.
- **UserController_getUserPnL**
  - Retrieve user profit and loss data.
- **UserController_getUserVolume**
  - Fetch user trading volume data.
- **UserController_getUserWins**
  - Retrieve user wins data.

#### Guild Functions

- **GuildController_create**
  - Create a new guild with details.
- **GuildController_getGuilds**
  - List all guilds.
- **GuildController_getGuild**
  - Retrieve details of a specific guild.
- **GuildController_update**
  - Update guild information.
- **GuildController_createJoinRequest**
  - Manage join requests for guilds.
- **GuildController_acceptJoinRequest**
  - Accept a join request for a guild.
- **GuildController_declineJoinRequest**
  - Decline a join request for a guild.
- **GuildController_sendInvitationRequest**
  - Send an invitation to a user to join a guild.
- **GuildController_acceptInvitationRequest**
  - Accept an invitation to join a guild.
- **GuildController_declineInvitationRequest**
  - Decline an invitation to join a guild.
- **GuildController_getUserInvitationRequests**
  - Get all invitation requests for a user.
- **GuildController_getGuildJoinRequests**
  - Get all join requests for a guild.
- **GuildController_leave**
  - Leave a guild.
- **GuildController_kick**
  - Kick a user from a guild.
- **GuildController_createOwnershipTransfer**
  - Initiate an ownership transfer for a guild.
- **GuildController_acceptOwnershipTransfer**
  - Accept an ownership transfer request for a guild.
- **GuildController_declineOwnershipTransfer**
  - Decline an ownership transfer request for a guild.

#### Admin Functions

- **AdminController_auth**
  - Authenticate and/or register an admin.
- **AdminController_remove**
  - Remove a user from the database.
- **AdminController_suspend**
  - Suspend a user from the database.
- **AdminController_activateUser**
  - Unsuspend a user and restore access.
- **AdminController_getPlatFormVolume**
  - Get trading volume for the platform.
- **AdminController_getActiveRounds**
  - Retrieve all active trading rounds.
- **AdminController_createTradingRound**
  - Create a new trading round.
- **AdminController_endTradingRound**
  - End an existing trading round.
- **AdminController_modifyTradingRound**
  - Modify details of an existing trading round.
- **AdminController_getTradingRoundDetails**
  - Get details of a specific trading round.
- **AdminController_listActiveRoundParticipants**
  - List all participants of an active trading round.
- **AdminController_listAllUserspnl**
  - List profit and loss data for all users.
- **AdminController_listSuspendedAccounts**
  - List all currently suspended accounts.
- **AdminController_getAdminActionApproval**
  - Fetch approvals for admin actions.
- **AdminController_getMyActionApprovals**
  - Retrieve approvals for actions initiated by the admin.

#### Event Functions

- **EventsController_createEvent**
  - Create a new event.
- **EventsController_getEvents**
  - Fetch all events.
- **EventsController_getEvent**
  - Retrieve details of a specific event.
- **EventsController_createTask**
  - Create a new task for an event.
- **EventsController_completeUserTask**
  - Mark a task as completed by a user.
- **EventsController_completeGuildTask**
  - Mark a guild task as completed.

## Security

The API uses JWT for securing endpoints with sensitive data access. This involves bearer tokens to ensure that requests are authenticated and authorized appropriately.

The Admin auth uses a different security key and will only work for users that have and admin role

## software

Nestjs
Prisma
Mysql

## Nestjs

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Installation

```bash
$ yarn install
```

## Running the app

```bash
# development
$ yarn run start

# watch mode
$ yarn run start:dev

# production mode
$ yarn run start:prod
```

## Test

```bash
# unit tests
$ yarn run test

# e2e tests
$ yarn run test:e2e

# test coverage
$ yarn run test:cov
```
