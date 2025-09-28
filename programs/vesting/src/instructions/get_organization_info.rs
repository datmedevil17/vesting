use anchor_lang::prelude::*;
use crate::{OrganizationInfo, states::Organization};

pub fn get_organization_info(
    ctx: Context<GetOrganizationInfoCtx>,
    _org_id: u64,
) -> Result<OrganizationInfo> {
    let organization = &ctx.accounts.organization;
    
    Ok(OrganizationInfo {
        org_id: organization.org_id,
        name: organization.name.clone(),
        owner: organization.owner,
        total_employees: organization.total_employees,
        total_vesting_schedules: organization.total_vesting_schedules,
        created_at: organization.created_at,
        active: organization.active,
    })
}

#[derive(Accounts)]
#[instruction(org_id: u64)]
pub struct GetOrganizationInfoCtx<'info> {
    #[account(
        seeds = [b"organization", org_id.to_le_bytes().as_ref()],
        bump
    )]
    pub organization: Account<'info, Organization>,
}