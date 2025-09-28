use anchor_lang::prelude::*;
use crate::{VestingInfo, states::{Organization, VestingSchedule, Employee}, errors::ErrorCode};

pub fn get_employer_dashboard<'info>(
    ctx: Context<'_, '_ , 'info, 'info, GetEmployerDashboardCtx<'info>>,
    org_id: u64,
) -> Result<Vec<VestingInfo>> {
    let organization = &ctx.accounts.organization;
    
    if organization.owner != ctx.accounts.employer.key() {
        return Err(ErrorCode::UnauthorizedOrganizationOwner.into());
    }

    let current_time = Clock::get()?.unix_timestamp;
    let mut vesting_schedules = Vec::new();

    // Expect remaining_accounts in pairs: [VestingSchedule, Employee, VestingSchedule, Employee, ...]
    for chunk in ctx.remaining_accounts.chunks(2) {
        let sched_info = &chunk[0];

        if let Ok(vesting_schedule) = Account::<VestingSchedule>::try_from(sched_info) {
            if vesting_schedule.org_id != org_id {
                continue;
            }

            let (employee_name, employee_position) = if chunk.len() > 1 {
                let emp_info = &chunk[1];
                if let Ok(emp_data) = Account::<Employee>::try_from(emp_info) {
                    (emp_data.name.clone(), emp_data.position.clone())
                } else {
                    ("Unknown".to_string(), "Unknown".to_string())
                }
            } else {
                ("Unknown".to_string(), "Unknown".to_string())
            };

            let vested_amount = vesting_schedule.calculate_vested_amount(current_time);
            let claimable_amount = vesting_schedule.calculate_claimable_amount(current_time);

            vesting_schedules.push(VestingInfo {
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
                employee_name,
                employee_position,
                created_at: vesting_schedule.created_at,
                org_id: vesting_schedule.org_id,
            });
        }
    }

    Ok(vesting_schedules)
}

#[derive(Accounts)]
#[instruction(org_id: u64)]
pub struct GetEmployerDashboardCtx<'info> {
    #[account(
        seeds = [b"organization", org_id.to_le_bytes().as_ref()],
        bump
    )]
    pub organization: Account<'info, Organization>,
    pub employer: Signer<'info>,
    // remaining_accounts: VestingSchedule, Employee, ...
}
