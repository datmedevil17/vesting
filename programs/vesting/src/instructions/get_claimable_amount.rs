use anchor_lang::prelude::*;
use crate::states::VestingSchedule;

pub fn get_claimable_amount(ctx: Context<GetClaimableAmountCtx>) -> Result<u64> {
    let vesting_schedule = &ctx.accounts.vesting_schedule;
    let current_time = Clock::get()?.unix_timestamp;
    
    Ok(vesting_schedule.calculate_claimable_amount(current_time))
}

#[derive(Accounts)]
pub struct GetClaimableAmountCtx<'info> {
    #[account(
        seeds = [
            b"vesting_schedule",
            vesting_schedule.org_id.to_le_bytes().as_ref(),
            vesting_schedule.employee.as_ref(),
            vesting_schedule.token_mint.as_ref(),
            vesting_schedule.schedule_id.to_le_bytes().as_ref()
        ],
        bump
    )]
    pub vesting_schedule: Account<'info, VestingSchedule>,
}