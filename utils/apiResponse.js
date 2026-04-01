const sendSuccess = (res, message, data = null, status = 200) => {
    res.status(status).json({
        success: true,
        message,
        data
    });
}

const sendError = (res, message, status = 400, details = null) => {
    res.status(status).json({
        success: false,
        message,
        details
    });
}

export { sendSuccess, sendError }
