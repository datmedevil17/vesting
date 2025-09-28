use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount, Transfer, transfer};
use crate::{errors::ErrorCode, states::VestingSchedule};

pub fn revoke_vesting(ctx: Context<RevokeVestingCtx>) -> Result<()> {
    let vesting_schedule = &mut ctx.accounts.vesting_schedule;
    let current_time = Clock::get()?.unix_timestamp;

    if vesting_schedule.revoked {
        return Err(ErrorCode::VestingScheduleAlreadyRevoked.into());
    }
    if !vesting_schedule.revocable {
        return Err(ErrorCode::VestingScheduleNotRevocable.into());
    }

    let unvested_amount = vesting_schedule.calculate_unvested_amount(current_time);
    vesting_schedule.revoked = true;
    vesting_schedule.revoke_time = Some(current_time);

    if unvested_amount > 0 {
        let org_id = vesting_schedule.org_id;
        let employee = vesting_schedule.employee;
        let token_mint = vesting_schedule.token_mint;
        let schedule_id = vesting_schedule.schedule_id;

        let org_id_bytes = org_id.to_le_bytes();
        let schedule_id_bytes = schedule_id.to_le_bytes();
        let bump_bytes = [ctx.bumps.vesting_schedule];

        let seeds = &[
            b"vesting_schedule",
            org_id_bytes.as_ref(),
            employee.as_ref(),
            token_mint.as_ref(),
            schedule_id_bytes.as_ref(),
            &bump_bytes,
        ];
        let signer_seeds = &[&seeds[..]];

        let transfer_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.vesting_token_account.to_account_info(),
                to: ctx.accounts.employer_token_account.to_account_info(),
                authority: vesting_schedule.to_account_info(),
            },
            signer_seeds,
        );
        transfer(transfer_ctx, unvested_amount)?;
    }

    msg!("Vesting schedule revoked. Returned {} unvested tokens to employer", unvested_amount);
    Ok(())
}

#[derive(Accounts)]
pub struct RevokeVestingCtx<'info> {
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
        constraint = vesting_schedule.employer == employer.key() @ ErrorCode::UnauthorizedOrganizationOwner
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
        constraint = employer_token_account.mint == vesting_schedule.token_mint,
        constraint = employer_token_account.owner == employer.key()
    )]
    pub employer_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub employer: Signer<'info>,
    pub token_program: Program<'info, Token>,
}
