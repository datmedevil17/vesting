# Solana Token Vesting Program

A comprehensive Solana program for managing token vesting schedules with organizational structure, built using the Anchor framework. This program enables organizations to create, manage, and track token vesting schedules for their employees.

## 🚀 Features

- **Organization Management**: Create and manage organizations with multiple employees
- **Employee Management**: Join/leave organizations with role-based access
- **Vesting Schedules**: Create customizable token vesting schedules with cliff periods
- **Token Claims**: Automated vesting calculations with secure token claiming
- **Revocation Support**: Employer ability to revoke vesting schedules (if enabled)
- **Dashboard Analytics**: Comprehensive dashboards for employers and employees
- **Real-time Calculations**: Dynamic vesting amount calculations based on time progression

## 🏗️ Program Architecture

### Core Data Structures

#### ProgramState
Global program state tracking:
- Total organizations, employees, and vesting schedules
- Program admin
- Initialization status

#### Organization
- Unique organization ID
- Organization name and owner
- Employee and vesting schedule counters
- Creation timestamp and active status

#### Employee
- Employee public key and profile information
- Organization association
- Join date and active status
- Vesting schedule counter

#### VestingSchedule
- Comprehensive vesting parameters (amounts, times, etc.)
- Revocation settings and status
- Claimed amount tracking
- Built-in vesting calculation methods

## 📋 Program Instructions

### 1. Program Initialization
**Function**: `initialize_program`
- Initializes the global program state
- Sets up the program admin
- Creates the foundational PDA accounts

### 2. Organization Management

#### Create Organization
**Function**: `create_organization`
- Creates a new organization with unique ID
- Sets up organization PDA account
- Assigns organization owner

**Parameters**:
- `name`: Organization name (max 100 characters)

#### Join Organization
**Function**: `join_organization`
- Adds employee to an organization
- Creates employee PDA account
- Records join timestamp

**Parameters**:
- `org_id`: Target organization ID
- `employee_name`: Employee name (max 50 characters)
- `employee_position`: Employee position (max 50 characters)

#### Remove Employee from Organization
**Function**: `remove_employee_from_org`
- Removes employee from organization
- Deactivates employee account
- Can only be performed by organization owner

**Parameters**:
- `org_id`: Organization ID

### 3. Vesting Schedule Management

#### Initialize Vesting Schedule
**Function**: `initialize_vesting_schedule`
- Creates a new vesting schedule for an employee
- Transfers tokens to escrow account
- Sets up automated vesting calculations

**Parameters**:
- `org_id`: Organization ID
- `total_amount`: Total tokens to vest
- `start_time`: Vesting start timestamp
- `cliff_time`: Cliff period end timestamp
- `end_time`: Vesting completion timestamp
- `revocable`: Whether schedule can be revoked

**Validations**:
- `total_amount > 0`
- `start_time < cliff_time < end_time`
- Minimum vesting duration: 1 day
- Employee must be active
- Only organization owner can create schedules

#### Claim Tokens
**Function**: `claim_tokens`
- Allows employees to claim vested tokens
- Automatically calculates claimable amount
- Transfers tokens from escrow to employee

**Validations**:
- Schedule not revoked
- Cliff time reached
- Tokens available to claim
- Only employee can claim

#### Revoke Vesting
**Function**: `revoke_vesting`
- Allows employers to revoke vesting schedules
- Returns unvested tokens to employer
- Only available for revocable schedules

**Validations**:
- Schedule must be revocable
- Not already revoked
- Only organization owner can revoke

### 4. Analytics & Dashboard Functions

#### Get Employer Dashboard
**Function**: `get_employer_dashboard`
- Returns comprehensive vesting data for organization
- Includes all employee vesting schedules
- Shows vested, claimable, and total amounts

#### Get Employee Dashboard
**Function**: `get_employee_dashboard`
- Returns employee's vesting schedules across organizations
- Shows current vesting status and claimable amounts

#### Get Organization Info
**Function**: `get_organization_info`
- Returns organization details and statistics

#### Get Employee Info
**Function**: `get_employee_info`
- Returns employee profile and statistics

#### Get Vesting Info
**Function**: `get_vesting_info`
- Returns detailed information about specific vesting schedule

#### Get Claimable Amount
**Function**: `get_claimable_amount`
- Returns current claimable token amount for a schedule

#### Get Dashboard Stats
**Function**: `get_dashboard_stats`
- Returns global program statistics

## 🔄 User Flow Examples

### Employer Workflow
1. **Initialize Program** (Admin only)
2. **Create Organization**
   ```rust
   // Create organization named "TechCorp"
   create_organization(ctx, "TechCorp".to_string())
   ```

3. **Employee Joins Organization**
   ```rust
   // Employee joins as "Senior Developer"
   join_organization(ctx, 1, "Alice Smith".to_string(), "Senior Developer".to_string())
   ```

4. **Create Vesting Schedule**
   ```rust
   // Vest 10,000 tokens over 4 years with 1-year cliff
   initialize_vesting_schedule(
       ctx,
       1,                    // org_id
       10_000_000_000,      // total_amount (with decimals)
       start_timestamp,     // start_time
       cliff_timestamp,     // cliff_time (1 year later)
       end_timestamp,       // end_time (4 years later)
       true                 // revocable
   )
   ```

5. **Monitor Dashboard**
   ```rust
   get_employer_dashboard(ctx, 1) // View all org vesting schedules
   ```

### Employee Workflow
1. **Check Dashboard**
   ```rust
   get_employee_dashboard(ctx) // View all vesting schedules
   ```

2. **Check Claimable Amount**
   ```rust
   get_claimable_amount(ctx) // Check available tokens
   ```

3. **Claim Vested Tokens**
   ```rust
   claim_tokens(ctx) // Claim available tokens
   ```

## 🧮 Vesting Calculations

The program implements linear vesting with cliff periods:

### Vesting Formula
```rust
if current_time < cliff_time {
    vested_amount = 0
} else if current_time >= end_time {
    vested_amount = total_amount
} else {
    vesting_duration = end_time - cliff_time
    elapsed_time = current_time - cliff_time
    vested_amount = (total_amount * elapsed_time) / vesting_duration
}

claimable_amount = vested_amount - claimed_amount
```

### Example Scenarios

**4-Year Vesting with 1-Year Cliff**:
- **Months 0-12**: 0% vested (cliff period)
- **Month 13**: 25% vested (cliff amount)
- **Month 24**: 50% vested
- **Month 36**: 75% vested
- **Month 48**: 100% vested

## 🔐 Security Features

### Access Control
- **Organization Owners**: Can create vesting schedules, remove employees, revoke vesting
- **Employees**: Can only claim their own tokens
- **Program Admin**: Can initialize program

### PDA Security
- All accounts use Program Derived Addresses (PDAs)
- Deterministic account generation prevents unauthorized access
- Seed-based account validation

### Token Safety
- Tokens held in escrow until vesting
- Automatic calculation prevents over-claiming
- Revocation returns unvested tokens to employer

### Validation Checks
- Time parameter validation
- Amount validation
- Status checks (active employees, non-revoked schedules)
- Ownership verification

## 🚀 Deployment & Testing

### Prerequisites
```bash
# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/v1.18.4/install)"

# Install Anchor CLI
cargo install --git https://github.com/coral-xyz/anchor avm --force
avm install latest
avm use latest

# Install Node.js dependencies
npm install
```

### Build & Deploy
```bash
# Build the program
anchor build

# Deploy to devnet
anchor deploy --provider.cluster devnet

# Run tests
anchor test
```

### Configuration
Update `Anchor.toml` with your cluster settings:
```toml
[features]
resolution = true
skip-lint = false

[programs.devnet]
vesting = "715ceC5BR6BkE5n3aaQct2N8YsouNJXqLHM1NcCspAha"

[provider]
cluster = "devnet"
wallet = "~/.config/solana/id.json"
```

## 📊 Program Constants

```rust
pub const MIN_VESTING_DURATION: i64 = 86400; // 1 day minimum
pub const MAX_EMPLOYEE_NAME_LENGTH: usize = 50;
pub const MAX_EMPLOYEE_POSITION_LENGTH: usize = 50;
pub const MAX_ORG_NAME_LENGTH: usize = 100;
pub const MAX_EMPLOYEES_PER_ORG: u64 = 1000;
```

## ⚠️ Error Handling

The program includes comprehensive error handling:

- **InvalidTimeParameters**: Start, cliff, and end times must be in correct order
- **VestingDurationTooShort**: Minimum 1-day vesting period required
- **UnauthorizedOrganizationOwner**: Only org owners can perform certain actions
- **CliffTimeNotReached**: Tokens cannot be claimed before cliff period
- **VestingScheduleRevoked**: Cannot claim from revoked schedules
- **InsufficientTokensInVestingAccount**: Escrow account validation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add comprehensive tests
4. Ensure all validations pass
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 🔗 Additional Resources

- [Solana Documentation](https://docs.solana.com/)
- [Anchor Framework](https://www.anchor-lang.com/)
- [Solana Program Library](https://spl.solana.com/)

---

**Note**: This program is designed for educational and development purposes. Ensure thorough testing and auditing before production use.
