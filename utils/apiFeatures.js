class APIFeatures{
    constructor(queryMongo, queryStringUrl){
        this.queryMongo = queryMongo;
        this.queryStringUrl = queryStringUrl;
    }

    // queryMongo does not need await in function because we need to chain it...
    // example: Tour.find().find(JSON.parse(queryStr))
    // we await at tours
    
    filter(){
        const queryObj = {...this.queryStringUrl};
        const excludedFields = ['page','sort','limit','fields'];
        excludedFields.forEach(el => {
            return delete queryObj[el];
        });


        // 2) Advance filtering
        let queryStr = JSON.stringify(queryObj);
        // using regex to replace
        queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => {
            return `$${match}`;
        });

        this.queryMongo = this.queryMongo.find(JSON.parse(queryStr));

        return this;
    }

    sort(){
        if(this.queryStringUrl.sort){
            const sortBy = this.queryStringUrl.sort.split(',').join(' ');
            // sort('price ratingsAverage');

            // sort the query based on price
            this.queryMongo = this.queryMongo.sort(this.queryStringUrl.sort);
        }else{
            // sort based on date created
            this.queryMongo = this.queryMongo.sort('-createdAt');
        }

        return this;
    }

    limitFields(){
        if(this.queryStringUrl.fields){
            const fields = this.queryStringUrl.fields.split(',').join(' ');
            // query = query.select('name duration price');
            this.queryMongo = this.queryMongo.select(fields);
        }else{
            // - is exclude in mongose
            this.queryMongo = this.queryMongo.select('-__v');
        }

        return this;
    }

    paginate(){
         // default result is 1
         const page = this.queryStringUrl.page * 1 || 1;
         // default limit is 100
         const limit = this.queryStringUrl.limit * 1 || 100;
         const skip = (page - 1) * limit;
 
 
         // page=2&limit=10, 1-10, page 1, 11-20, page 2
         this.queryMongo = this.queryMongo.skip(skip).limit(limit);

        return this;
    }
}


module.exports = APIFeatures;