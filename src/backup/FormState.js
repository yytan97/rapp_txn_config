class FormState {
    
    constructor(dirty, invalid, fieldList) {
      this.dirty = dirty;
      this.invalid = invalid;
      this.fieldList = fieldList;
      
    };

    getFieldState(name) {
        if (fieldList[name] == undefined) return {};
        return fieldList[name];
    };

    getFieldErrorState(name, errorName) {
        if (fieldList[name] == undefined) return false;
        if (fieldList[name] && fieldList[name][errorName] == undefined) return false;
        return fieldList[name][errorName];
    };

  }