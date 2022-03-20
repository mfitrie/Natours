// Handle error in async function
// the catch 'next' will end up in error handling global middleware
const catchAsync = (fn)=>{

    return (req, res, next) => {
        fn(req, res, next)
        .catch(next);
    };

};

module.exports = catchAsync;