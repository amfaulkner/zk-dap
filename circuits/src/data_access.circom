pragma circom 2.0.0;

// Using simpler include path since we're providing the include directory to circom
include "circomlib/circuits/comparators.circom";

/*
 * Data Access Circuit
 *
 * Proves that a user has sufficient permission level to access a resource
 * without revealing their actual permission level.
 *
 * Private inputs:
 *   - userPermission: The user's actual permission level (kept private)
 *
 * Public inputs:
 *   - requiredPermission: The minimum permission level required for the resource
 *   - resourceId: The ID of the resource being accessed
 *
 * Output:
 *   - accessGranted: 1 if access is granted, 0 otherwise
 */
template DataAccess() {
    // Private input - not revealed
    signal input userPermission;
    
    // Public inputs
    signal input requiredPermission;
    signal input resourceId;
    
    // Output signal
    signal output accessGranted;
    
    // Use the greaterEqThan component to check if userPermission >= requiredPermission
    component comparison = GreaterEqThan(32); // 32-bit comparison
    comparison.in[0] <== userPermission;
    comparison.in[1] <== requiredPermission;
    
    // Set the access result based on the comparison
    accessGranted <== comparison.out;
    
    // NOTE: We include resourceId in the circuit but don't use it in the comparison
    // This ensures it's part of the public inputs and gets verified
    // In a real application, you might use the resourceId in a more complex way
    signal resourceIdCheck;
    resourceIdCheck <== resourceId; // Just to avoid warnings about unused signals
}

component main {public [requiredPermission, resourceId]} = DataAccess(); 