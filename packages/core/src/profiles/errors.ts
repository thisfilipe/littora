export class ProfileIdentityMismatchError extends Error {
    constructor() {
        super('The authenticated Jellyfin user does not match the selected profile');
        this.name = 'ProfileIdentityMismatchError';
    }
}
