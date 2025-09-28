use anchor_lang::prelude::*;
use crate::{
    constants::*,
    errors::ErrorCode,
    states::{Employee, Organization, ProgramState}
};

pub fn join_organization(
    ctx: Context<JoinOrganizationCtx>,
    org_id: u64,
    employee_name: String,
    employee_position: String,
) -> Result<()> {
    if employee_name.len() > MAX_EMPLOYEE_NAME_LENGTH {
        return Err(ErrorCode::EmployeeNameTooLong.into());
    }
    if employee_position.len() > MAX_EMPLOYEE_POSITION_LENGTH {
        return Err(ErrorCode::EmployeePositionTooLong.into());
    }

    let organization = &mut ctx.accounts.organization;
    let employee = &mut ctx.accounts.employee;
    let program_state = &mut ctx.accounts.program_state;

    if !organization.active {
        return Err(ErrorCode::OrganizationNotActive.into());
    }
    if organization.total_employees >= MAX_EMPLOYEES_PER_ORG {
        return Err(ErrorCode::OrganizationEmployeeLimitReached.into());
    }

    organization.total_employees += 1;
    program_state.total_employees += 1;

    employee.employee = ctx.accounts.employee_signer.key();
    employee.name = employee_name.clone();
    employee.position = employee_position.clone();
    employee.org_id = org_id;
    employee.joined_at = Clock::get()?.unix_timestamp;
    employee.active = true;
    employee.total_vesting_schedules = 0;

    msg!("Employee '{}' joined organization '{}'", employee_name, organization.name);
    Ok(())
}

#[derive(Accounts)]
#[instruction(org_id: u64, employee_name: String, employee_position: String)]
pub struct JoinOrganizationCtx<'info> {
    #[account(mut)]
    pub program_state: Account<'info, ProgramState>,
    
    #[account(
        mut,
        seeds = [b"organization", org_id.to_le_bytes().as_ref()],
        bump
    )]
    pub organization: Account<'info, Organization>,
    
    #[account(
        init,
        payer = employee_signer,
        space = ANCHOR_DISCRIMINATOR_SIZE + Employee::INIT_SPACE,
        seeds = [
            b"employee",
            employee_signer.key().as_ref(),
            org_id.to_le_bytes().as_ref()
        ],
        bump
    )]
    pub employee: Account<'info, Employee>,
    
    #[account(mut)]
    pub employee_signer: Signer<'info>,
    pub system_program: Program<'info, System>,
}
