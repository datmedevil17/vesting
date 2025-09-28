use anchor_lang::prelude::*;
use crate::{constants::ANCHOR_DISCRIMINATOR_SIZE, errors::ErrorCode, states::ProgramState};

pub fn initialize_program(ctx: Context<InitializeProgramCtx>) -> Result<()> {
    let program_state = &mut ctx.accounts.program_state;
    if program_state.initialized {
        return Err(ErrorCode::AlreadyInitialized.into());
    }
    program_state.initialized = true;
    program_state.total_organizations = 0;
    program_state.total_employees = 0;
    program_state.total_vesting_schedules = 0;
    program_state.admin = ctx.accounts.admin.key();
    msg!("Token Vesting Program initialized successfully");
    Ok(())
}

#[derive(Accounts)]
pub struct InitializeProgramCtx<'info> {
    #[account(
        init,
        payer = admin,
        space = ANCHOR_DISCRIMINATOR_SIZE + ProgramState::INIT_SPACE,
        seeds = [b"program_state"],
        bump
    )]
    pub program_state: Account<'info, ProgramState>,
    #[account(mut)]
    pub admin: Signer<'info>,
    pub system_program: Program<'info, System>,
}
