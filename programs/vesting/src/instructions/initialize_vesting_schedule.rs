use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount, Transfer, transfer};
use crate::{
    constants::*,
    errors::ErrorCode,
    states::{Employee, Organization, ProgramState, VestingSchedule}
};

pub fn initialize_vesting_schedule(
    ctx: Context<InitializeVestingScheduleCtx>,
    _org_id: u64,
    total_amount: u64,
    start_time: i64,
    cliff_time: i64,
    end_time: i64,
    revocable: bool,
) -> Result<()> {
    if total_amount == 0 {
        return Err(ErrorCode::InvalidTotalAmount.into());
    }
    if start_time >= cliff_time || cliff_time >= end_time {
        return Err(ErrorCode::InvalidTimeParameters.into());
    }
    if end_time - start_time < MIN_VESTING_DURATION {
        return Err(ErrorCode::VestingDurationTooShort.into());
    }

    let organization = &mut ctx.accounts.organization;
    let employee = &mut ctx.accounts.employee;
    let program_state = &mut ctx.accounts.program_state;
    let vesting_schedule = &mut ctx.accounts.vesting_schedule;

    if organization.owner != ctx.accounts.employer.key() {
        return Err(ErrorCode::UnauthorizedOrganizationOwner.into());
    }
    if !employee.active {
        return Err(ErrorCode::EmployeeNotActive.into());
    }

    program_state.total_vesting_schedules += 1;
    organization.total_vesting_schedules += 1;
    employee.total_vesting_schedules += 1;
    
    vesting_schedule.org_id = organization.org_id;
    vesting_schedule.employer = ctx.accounts.employer.key();
    vesting_schedule.employee = employee.employee;
    vesting_schedule.token_mint = ctx.accounts.token_mint.key();
    vesting_schedule.total_amount = total_amount;
    vesting_schedule.start_time = start_time;
    vesting_schedule.cliff_time = cliff_time;
    vesting_schedule.end_time = end_time;
    vesting_schedule.claimed_amount = 0;
    vesting_schedule.revoked = false;
    vesting_schedule.revocable = revocable;
    vesting_schedule.revoke_time = None;
    vesting_schedule.schedule_id = program_state.total_vesting_schedules;
    vesting_schedule.created_at = Clock::get()?.unix_timestamp;

    let transfer_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.employer_token_account.to_account_info(),
            to: ctx.accounts.vesting_token_account.to_account_info(),
            authority: ctx.accounts.employer.to_account_info(),
        },
    );
    transfer(transfer_ctx, total_amount)?;

    msg!(
        "Vesting schedule created for employee: {} in organization: {}, amount: {}",
        employee.name,
        organization.name,
        total_amount
    );

    Ok(())
}
#[derive(Accounts)]
#[instruction(org_id: u64)]
pub struct InitializeVestingScheduleCtx<'info> {
    #[account(mut)]
    pub program_state: Account<'info, ProgramState>,

    #[account(mut, seeds = [b"organization", org_id.to_le_bytes().as_ref()], bump)]
    pub organization: Account<'info, Organization>,

    #[account(mut, seeds = [b"employee", employee.employee.as_ref(), org_id.to_le_bytes().as_ref()], bump)]
    pub employee: Account<'info, Employee>,

    #[account(init, payer = employer, space = ANCHOR_DISCRIMINATOR_SIZE + VestingSchedule::INIT_SPACE,
        seeds = [
            b"vesting_schedule",
            org_id.to_le_bytes().as_ref(),
            employee.employee.as_ref(),
            token_mint.key().as_ref(),
            (program_state.total_vesting_schedules + 1).to_le_bytes().as_ref()
        ],
        bump
    )]
    pub vesting_schedule: Account<'info, VestingSchedule>,

    // create ATA for vesting_schedule PDA
    #[account(
        init,
        payer = employer,
        associated_token::mint = token_mint,
        associated_token::authority = vesting_schedule,
    )]
    pub vesting_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = employer_token_account.mint == token_mint.key(),
        constraint = employer_token_account.owner == employer.key()
    )]
    pub employer_token_account: Account<'info, TokenAccount>,

    pub token_mint: Account<'info, Mint>,
    #[account(mut)]
    pub employer: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, anchor_spl::associated_token::AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}
