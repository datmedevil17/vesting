use anchor_lang::prelude::*;
use crate::{
    constants::*,
    errors::ErrorCode,
    states::{Organization, ProgramState}
};

pub fn create_organization(
    ctx: Context<CreateOrganizationCtx>,
    name: String,
) -> Result<()> {
    if name.len() > MAX_ORG_NAME_LENGTH {
        return Err(ErrorCode::OrganizationNameTooLong.into());
    }

    let program_state = &mut ctx.accounts.program_state;
    let organization = &mut ctx.accounts.organization;
    
    program_state.total_organizations += 1;
    
    organization.org_id = program_state.total_organizations;
    organization.name = name.clone();
    organization.owner = ctx.accounts.owner.key();
    organization.total_employees = 0;
    organization.total_vesting_schedules = 0;
    organization.created_at = Clock::get()?.unix_timestamp;
    organization.active = true;

    msg!("Organization '{}' created with ID: {}", name, organization.org_id);
    Ok(())
}

#[derive(Accounts)]
#[instruction(name: String)]
pub struct CreateOrganizationCtx<'info> {
    #[account(mut)]
    pub program_state: Account<'info, ProgramState>,
    
    #[account(
        init,
        payer = owner,
        space = ANCHOR_DISCRIMINATOR_SIZE + Organization::INIT_SPACE,
        seeds = [
            b"organization",
            (program_state.total_organizations + 1).to_le_bytes().as_ref()
        ],
        bump
    )]
    pub organization: Account<'info, Organization>,
    
    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}
