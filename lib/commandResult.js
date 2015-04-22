function CommandResult(args) {
    return {
        args: args,
        success: false,
        message: 'Invalid arguments',
        err: null,
        entity: null
    };
}

module.exports = CommandResult;