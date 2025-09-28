use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount, Transfer, transfer};
use crate::{errors::ErrorCode, states::VestingSchedule};

pub fn claim_tokens(ctx: Context<ClaimTokensCtx>) -> Result<()> {
    let vesting_schedule = &mut ctx.accounts.vesting_schedule;
    let current_time = Clock::get()?.unix_timestamp;

    if vesting_schedule.revoked {
        return Err(ErrorCode::VestingScheduleRevoked.into());
    }
    if current_time < vesting_schedule.cliff_time {
        return Err(ErrorCode::CliffTimeNotReached.into());
    }

    let claimable_amount = vesting_schedule.calculate_claimable_amount(current_time);
    if claimable_amount == 0 {
        return Err(ErrorCode::NoTokensAvailableToClaim.into());
    }

    vesting_schedule.claimed_amount += claimable_amount;

    let org_id = vesting_schedule.org_id;
    let employee = vesting_schedule.employee;
    let token_mint = vesting_schedule.token_mint;
    let schedule_id = vesting_schedule.schedule_id;

    let org_id = org_id.to_le_bytes();
    let schedule_id = schedule_id.to_le_bytes();
    let seeds = &[
        b"vesting_schedule",
        org_id.as_ref(),
        employee.as_ref(),
        token_mint.as_ref(),
        schedule_id.as_ref(),
        &[ctx.bumps.vesting_schedule],
    ];
    let signer_seeds = &[&seeds[..]];

    let transfer_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.vesting_token_account.to_account_info(),
            to: ctx.accounts.employee_token_account.to_account_info(),
            authority: vesting_schedule.to_account_info(),
        },
        signer_seeds,
    );
    transfer(transfer_ctx, claimable_amount)?;

    msg!("Employee claimed {} tokens. Total claimed: {}", claimable_amount, vesting_schedule.claimed_amount);
    Ok(())
}

#[derive(Accounts)]
pub struct ClaimTokensCtx<'info> {
    #[account(
        mut,
        seeds = [
            b"vesting_schedule",
            vesting_schedule.org_id.to_le_bytes().as_ref(),
            vesting_schedule.employee.as_ref(),
            vesting_schedule.token_mint.as_ref(),
            vesting_schedule.schedule_id.to_le_bytes().as_ref()
        ],
        bump,
        constraint = vesting_schedule.employee == employee.key() @ ErrorCode::UnauthorizedEmployee
    )]
    pub vesting_schedule: Account<'info, VestingSchedule>,
    
    #[account(
        mut,
        seeds = [b"vesting_token_account", vesting_schedule.key().as_ref()],
        bump
    )]
    pub vesting_token_account: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        constraint = employee_token_account.mint == vesting_schedule.token_mint,
        constraint = employee_token_account.owner == employee.key()
    )]
    pub employee_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub employee: Signer<'info>,
    pub token_program: Program<'info, Token>,
}