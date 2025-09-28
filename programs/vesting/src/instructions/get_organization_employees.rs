use anchor_lang::prelude::*;
use crate::{EmployeeInfo, states::{Organization, Employee}, errors::ErrorCode};

pub fn get_organization_employees<'info>(
    ctx: Context<'_, '_ , 'info, 'info, GetOrganizationEmployeesCtx<'info>>,
    _org_id: u64,
) -> Result<Vec<EmployeeInfo>> {
    let organization = &ctx.accounts.organization;
    
    if organization.owner != ctx.accounts.owner.key() {
        return Err(ErrorCode::UnauthorizedOrganizationOwner.into());
    }

    let mut employees = Vec::new();

    for account_info in ctx.remaining_accounts.iter() {
        if let Ok(employee) = Account::<Employee>::try_from(account_info) {
            if employee.org_id == organization.org_id {
                employees.push(EmployeeInfo {
                    employee: employee.employee,
                    name: employee.name.clone(),
                    position: employee.position.clone(),
                    org_id: employee.org_id,
                    joined_at: employee.joined_at,
                    active: employee.active,
                    total_vesting_schedules: employee.total_vesting_schedules,
                });
            }
        }
    }

    Ok(employees)
}

#[derive(Accounts)]
#[instruction(org_id: u64)]
pub struct GetOrganizationEmployeesCtx<'info> {
    #[account(
        seeds = [b"organization", org_id.to_le_bytes().as_ref()],
        bump
    )]
    pub organization: Account<'info, Organization>,
    pub owner: Signer<'info>,
}
