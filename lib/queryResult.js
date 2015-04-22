function QueryResult(args) {
    return {
        args: args,
        success: false,
        err: null,
        message: null,
        data: null
    };
}

module.exports = QueryResult;