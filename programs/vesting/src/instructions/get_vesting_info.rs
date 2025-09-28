use anchor_lang::prelude::*;
use crate::{states::VestingSchedule, VestingInfo};

pub fn get_vesting_info(ctx: Context<GetVestingInfoCtx>) -> Result<VestingInfo> {
    let vesting_schedule = &ctx.accounts.vesting_schedule;
    let current_time = Clock::get()?.unix_timestamp;
    
    let vested_amount = vesting_schedule.calculate_vested_amount(current_time);
    let claimable_amount = vesting_schedule.calculate_claimable_amount(current_time);

    Ok(VestingInfo {
        employer: vesting_schedule.employer,
        employee: vesting_schedule.employee,
        token_mint: vesting_schedule.token_mint,
        total_amount: vesting_schedule.total_amount,
        start_time: vesting_schedule.start_time,
        cliff_time: vesting_schedule.cliff_time,
        end_time: vesting_schedule.end_time,
        claimed_amount: vesting_schedule.claimed_amount,
        vested_amount,
        claimable_amount,
        revoked: vesting_schedule.revoked,
        revocable: vesting_schedule.revocable,
        employee_name: String::new(), // Would need to fetch from Employee account
        employee_position: String::new(), // Would need to fetch from Employee account
        created_at: vesting_schedule.created_at,
        org_id: vesting_schedule.org_id,
    })
}

#[derive(Accounts)]
pub struct GetVestingInfoCtx<'info> {
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