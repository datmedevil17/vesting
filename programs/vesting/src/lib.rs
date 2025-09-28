#![allow(unexpected_cfgs)]
#![allow(deprecated)]
use anchor_lang::prelude::*;

declare_id!("715ceC5BR6BkE5n3aaQct2N8YsouNJXqLHM1NcCspAha");

pub mod constants;
pub mod errors;
pub mod instructions;
pub mod states;

use crate::instructions::*;

// View-only return types
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct VestingInfo {
    pub employer: Pubkey,
    pub employee: Pubkey,
    pub token_mint: Pubkey,
    pub total_amount: u64,
    pub start_time: i64,
    pub cliff_time: i64,
    pub end_time: i64,
    pub claimed_amount: u64,
    pub vested_amount: u64,
    pub claimable_amount: u64,
    pub revoked: bool,
    pub revocable: bool,
    pub employee_name: String,
    pub employee_position: String,
    pub created_at: i64,
    pub org_id: u64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct OrganizationInfo {
    pub org_id: u64,
    pub name: String,
    pub owner: Pubkey,
    pub total_employees: u64,
    pub total_vesting_schedules: u64,
    pub created_at: i64,
    pub active: bool,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct EmployeeInfo {
    pub employee: Pubkey,
    pub name: String,
    pub position: String,
    pub org_id: u64,
    pub joined_at: i64,
    pub active: bool,
    pub total_vesting_schedules: u64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct DashboardStats {
    pub total_organizations: u64,
    pub total_employees: u64,
    pub total_vesting_schedules: u64,
}

#[program]
pub mod token_vesting {
    use super::*;

    pub fn initialize_program(ctx: Context<InitializeProgramCtx>) -> Result<()> {
        instructions::initialize_program(ctx)
    }

    // Organization Management
    pub fn create_organization(
        ctx: Context<CreateOrganizationCtx>,
        name: String,
    ) -> Result<()> {
        instructions::create_organization(ctx, name)
    }

    pub fn join_organization(
        ctx: Context<JoinOrganizationCtx>,
        org_id: u64,
        employee_name: String,
        employee_position: String,
    ) -> Result<()> {
        instructions::join_organization(ctx, org_id, employee_name, employee_position)
    }

    pub fn remove_employee_from_org(
        ctx: Context<RemoveEmployeeFromOrgCtx>,
        org_id: u64,
    ) -> Result<()> {
        instructions::remove_employee_from_org(ctx, org_id)
    }

    // Vesting Management
    pub fn initialize_vesting_schedule(
        ctx: Context<InitializeVestingScheduleCtx>,
        org_id: u64,
        total_amount: u64,
        start_time: i64,
        cliff_time: i64,
        end_time: i64,
        revocable: bool,
    ) -> Result<()> {
        instructions::initialize_vesting_schedule(
            ctx,
            org_id,
            total_amount,
            start_time,
            cliff_time,
            end_time,
            revocable,
        )
    }

    pub fn claim_tokens(ctx: Context<ClaimTokensCtx>) -> Result<()> {
        instructions::claim_tokens(ctx)
    }

    pub fn revoke_vesting(ctx: Context<RevokeVestingCtx>) -> Result<()> {
        instructions::revoke_vesting(ctx)
    }

    // Dashboard & Analytics Functions
        pub fn get_employer_dashboard<'info>(
            ctx: Context<'_, '_, 'info, 'info, GetEmployerDashboardCtx<'info>>,
            org_id: u64,
        ) -> Result<Vec<VestingInfo>> {
            instructions::get_employer_dashboard(ctx, org_id)
        }

    pub fn get_employee_dashboard<'info>(
        ctx: Context<'_, '_, 'info, 'info, GetEmployeeDashboardCtx<'info>>,
    ) -> Result<Vec<VestingInfo>> {
        instructions::get_employee_dashboard(ctx)
    }

    pub fn get_organization_employees<'info>(
        ctx: Context<'_, '_, 'info, 'info, GetOrganizationEmployeesCtx<'info>>,
        org_id: u64,
    ) -> Result<Vec<EmployeeInfo>> {
        instructions::get_organization_employees(ctx, org_id)
    }

    pub fn get_organization_info(
        ctx: Context<GetOrganizationInfoCtx>,
        org_id: u64,
    ) -> Result<OrganizationInfo> {
        instructions::get_organization_info(ctx, org_id)
    }

    pub fn get_employee_info(
        ctx: Context<GetEmployeeInfoCtx>,
        org_id: u64,
    ) -> Result<EmployeeInfo> {
        instructions::get_employee_info(ctx, org_id)
    }

    // Individual getters
    pub fn get_vesting_info(ctx: Context<GetVestingInfoCtx>) -> Result<VestingInfo> {
        instructions::get_vesting_info(ctx)
    }

    pub fn get_claimable_amount(ctx: Context<GetClaimableAmountCtx>) -> Result<u64> {
        instructions::get_claimable_amount(ctx)
    }

    pub fn get_dashboard_stats(ctx: Context<GetDashboardStatsCtx>) -> Result<DashboardStats> {
        instructions::get_dashboard_stats(ctx)
    }
}