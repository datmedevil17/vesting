use anchor_lang::prelude::*;
use crate::{
    errors::ErrorCode,
    states::{Employee, Organization}
};

pub fn remove_employee_from_org(
    ctx: Context<RemoveEmployeeFromOrgCtx>,
    _org_id: u64,
) -> Result<()> {
    let organization = &mut ctx.accounts.organization;
    let employee = &mut ctx.accounts.employee;

    if organization.owner != ctx.accounts.owner.key() {
        return Err(ErrorCode::UnauthorizedOrganizationOwner.into());
    }

    employee.active = false;
    organization.total_employees -= 1;

    msg!("Employee '{}' removed from organization '{}'", employee.name, organization.name);
    Ok(())
}

#[derive(Accounts)]
#[instruction(org_id: u64)]
pub struct RemoveEmployeeFromOrgCtx<'info> {
    #[account(
        mut,
        seeds = [b"organization", org_id.to_le_bytes().as_ref()],
        bump
    )]
    pub organization: Account<'info, Organization>,
    
    #[account(
        mut,
        seeds = [
            b"employee",
            employee.employee.as_ref(),
            org_id.to_le_bytes().as_ref()
        ],
        bump
    )]
    pub employee: Account<'info, Employee>,
    
    #[account(mut)]
    pub owner: Signer<'info>,
}