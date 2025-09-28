use anchor_lang::prelude::*;
use crate::{VestingInfo, states::{Employee, VestingSchedule}};

pub fn get_employee_dashboard<'info>(
    ctx: Context<'_, '_, 'info, 'info, GetEmployeeDashboardCtx<'info>>,
) -> Result<Vec<VestingInfo>> {
    let current_time = Clock::get()?.unix_timestamp;
    let employee_key = ctx.accounts.employee.key();
    let mut vesting_schedules = Vec::new();

    for chunk in ctx.remaining_accounts.chunks(2) {
        let sched_info = &chunk[0];

        if let Ok(vesting_schedule) = Account::<VestingSchedule>::try_from(sched_info) {
            if vesting_schedule.employee != employee_key {
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
pub struct GetEmployeeDashboardCtx<'info> {
    pub employee: Signer<'info>,
}
