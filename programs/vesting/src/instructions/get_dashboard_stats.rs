use anchor_lang::prelude::*;
use crate::{states::ProgramState, DashboardStats};

pub fn get_dashboard_stats(ctx: Context<GetDashboardStatsCtx>) -> Result<DashboardStats> {
    let program_state = &ctx.accounts.program_state;
    
    Ok(DashboardStats {
        total_organizations: program_state.total_organizations,
        total_employees: program_state.total_employees,
        total_vesting_schedules: program_state.total_vesting_schedules,
    })
}

#[derive(Accounts)]
pub struct GetDashboardStatsCtx<'info> {
    #[account(
        seeds = [b"program_state"],
        bump
    )]
    pub program_state: Account<'info, ProgramState>,
}