


use anchor_lang::prelude::*;
use crate::{EmployeeInfo, states::Employee};

pub fn get_employee_info(
    ctx: Context<GetEmployeeInfoCtx>,
    _org_id: u64,
) -> Result<EmployeeInfo> {
    let employee = &ctx.accounts.employee;
    
    Ok(EmployeeInfo {
        employee: employee.employee,
        name: employee.name.clone(),
        position: employee.position.clone(),
        org_id: employee.org_id,
        joined_at: employee.joined_at,
        active: employee.active,
        total_vesting_schedules: employee.total_vesting_schedules,
    })
}

#[derive(Accounts)]
#[instruction(org_id: u64)]
pub struct GetEmployeeInfoCtx<'info> {
    #[account(
        seeds = [
            b"employee",
            employee.employee.as_ref(),
            org_id.to_le_bytes().as_ref()
        ],
        bump
    )]
    pub employee: Account<'info, Employee>,
}