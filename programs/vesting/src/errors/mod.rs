use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("Program already initialized")]
    AlreadyInitialized,
    #[msg("Invalid time parameters: start_time >= cliff_time >= end_time")]
    InvalidTimeParameters,
    #[msg("Vesting duration too short")]
    VestingDurationTooShort,
    #[msg("Total amount must be greater than 0")]
    InvalidTotalAmount,
    #[msg("Employee name too long")]
    EmployeeNameTooLong,
    #[msg("Employee position too long")]
    EmployeePositionTooLong,
    #[msg("Organization name too long")]
    OrganizationNameTooLong,
    #[msg("Organization not found")]
    OrganizationNotFound,
    #[msg("Employee not found")]
    EmployeeNotFound,
    #[msg("Employee already exists in organization")]
    EmployeeAlreadyExists,
    #[msg("Employee not in organization")]
    EmployeeNotInOrganization,
    #[msg("Organization has reached maximum employee limit")]
    OrganizationEmployeeLimitReached,
    #[msg("Vesting schedule not found")]
    VestingScheduleNotFound,
    #[msg("Cliff time has not been reached")]
    CliffTimeNotReached,
    #[msg("No tokens available to claim")]
    NoTokensAvailableToClaim,
    #[msg("Vesting schedule already revoked")]
    VestingScheduleAlreadyRevoked,
    #[msg("Vesting schedule is not revocable")]
    VestingScheduleNotRevocable,
    #[msg("Only organization owner can perform this action")]
    UnauthorizedOrganizationOwner,
    #[msg("Only employee can perform this action")]
    UnauthorizedEmployee,
    #[msg("Insufficient tokens in vesting account")]
    InsufficientTokensInVestingAccount,
    #[msg("Vesting schedule is revoked")]
    VestingScheduleRevoked,
    #[msg("Organization is not active")]
    OrganizationNotActive,
    #[msg("Employee is not active")]
    EmployeeNotActive,
}