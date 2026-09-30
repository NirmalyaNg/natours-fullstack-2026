module.exports = class ApiFeatures {
  constructor(dbQuery, queryParams) {
    this.dbQuery = dbQuery;
    this.queryParams = queryParams;
  }

  filter() {
    const queryParamsClone = { ...this.queryParams };
    const attributesToBeRemoved = ['page', 'limit', 'sort', 'fields'];

    attributesToBeRemoved.forEach((attr) => delete queryParamsClone[attr]);

    let queryParamsCloneStr = JSON.stringify(queryParamsClone);
    queryParamsCloneStr = queryParamsCloneStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    this.dbQuery = this.dbQuery.find(JSON.parse(queryParamsCloneStr));
    return this;
  }

  sort() {
    if (this.queryParams.sort) {
      this.dbQuery = this.dbQuery.sort(this.queryParams.sort.split(',').join(' '));
    } else {
      this.dbQuery = this.dbQuery.sort('-createdAt');
    }
    return this;
  }

  paginate() {
    const limit = Math.max(parseInt(this.queryParams.limit, 10) || 5, 1);
    const page = Math.max(parseInt(this.queryParams.page, 10) || 1, 1);
    const skip = (page - 1) * limit;

    this.dbQuery = this.dbQuery.limit(limit).skip(skip);
    return this;
  }

  selectFields() {
    if (this.queryParams.fields) {
      this.dbQuery = this.dbQuery.select(this.queryParams.fields.split(',').join(' '));
    } else {
      this.dbQuery = this.dbQuery.select('-__v');
    }
    return this;
  }
};
