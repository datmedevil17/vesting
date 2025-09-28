use anchor_lang::prelude::*;
use crate::constants::*;

#[account]
#[derive(InitSpace)]
pub struct ProgramState {
    pub initialized: bool,
    pub total_organizations: u64,
    pub total_employees: u64,
    pub total_vesting_schedules: u64,
    pub admin: Pubkey,
}

#[account]
#[derive(InitSpace)]
pub struct Organization {
    pub org_id: u64,
    #[max_len(MAX_ORG_NAME_LENGTH)]
    pub name: String,
    pub owner: Pubkey,
    pub total_employees: u64,
    pub total_vesting_schedules: u64,
    pub created_at: i64,
    pub active: bool,
}

#[account]
#[derive(InitSpace)]
pub struct Employee {
    pub employee: Pubkey,
    #[max_len(MAX_EMPLOYEE_NAME_LENGTH)]
    pub name: String,
    #[max_len(MAX_EMPLOYEE_POSITION_LENGTH)]
    pub position: String,
    pub org_id: u64,
    pub joined_at: i64,
    pub active: bool,
    pub total_vesting_schedules: u64,
}

#[account]
#[derive(InitSpace)]
pub struct VestingSchedule {
    pub org_id: u64,
    pub employer: Pubkey,
    pub employee: Pubkey,
    pub token_mint: Pubkey,
    pub total_amount: u64,
    pub start_time: i64,
    pub cliff_time: i64,
    pub end_time: i64,
    pub claimed_amount: u64,
    pub revoked: bool,
    pub revocable: bool,
    pub revoke_time: Option<i64>,
    pub schedule_id: u64,
    pub created_at: i64,
}

impl VestingSchedule {
    pub fn calculate_vested_amount(&self, current_time: i64) -> u64 {
        if self.revoked && current_time > self.revoke_time.unwrap_or(0) {
            return self.calculate_vested_amount_at_time(self.revoke_time.unwrap_or(0));
        }
        self.calculate_vested_amount_at_time(current_time)
    }

    fn calculate_vested_amount_at_time(&self, timestamp: i64) -> u64 {
        if timestamp < self.cliff_time {
            return 0;
        }
        if timestamp >= self.end_time {
            return self.total_amount;
        }
        let vesting_duration = self.end_time - self.cliff_time;
        let elapsed_time = timestamp - self.cliff_time;
        let vested_amount = (self.total_amount as u128)
            .checked_mul(elapsed_time as u128)
            .unwrap()
            .checked_div(vesting_duration as u128)
            .unwrap() as u64;
        vested_amount
    }

    pub fn calculate_claimable_amount(&self, current_time: i64) -> u64 {
        let vested_amount = self.calculate_vested_amount(current_time);
        vested_amount.saturating_sub(self.claimed_amount)
    }

    pub fn calculate_unvested_amount(&self, current_time: i64) -> u64 {
        self.total_amount.saturating_sub(self.calculate_vested_amount(current_time))
    }
}