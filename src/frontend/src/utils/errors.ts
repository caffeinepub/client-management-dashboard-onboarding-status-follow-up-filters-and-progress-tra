/**
 * Normalizes backend errors into user-friendly English messages
 */
export function normalizeError(error: unknown): string {
  if (!error) {
    return 'An unexpected error occurred';
  }

  // Handle Error objects
  if (error instanceof Error) {
    const message = error.message;
    
    // Normalize common backend trap messages
    if (message.includes('Cannot directly set onboarding state to full')) {
      return 'Please complete onboarding steps individually';
    }
    
    if (message.includes('Cannot change onboarding state of activated client')) {
      return 'Cannot change onboarding state after activation';
    }
    
    if (message.includes('Cannot activate client')) {
      return 'Client must complete full onboarding before activation';
    }
    
    if (message.includes('not found')) {
      return 'Client not found';
    }
    
    if (message.includes('Unauthorized')) {
      return 'You do not have permission to perform this action';
    }
    
    if (message.includes('Client is not currently paused')) {
      return 'Client is not currently paused';
    }
    
    // Return the original message if it's already user-friendly
    if (message.length < 100 && !message.includes('trap') && !message.includes('IC0')) {
      return message;
    }
    
    return 'An error occurred. Please try again.';
  }

  // Handle string errors
  if (typeof error === 'string') {
    return error;
  }

  // Handle objects with message property
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return normalizeError((error as { message: unknown }).message);
  }

  return 'An unexpected error occurred';
}
