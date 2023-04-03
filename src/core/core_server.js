class UserModel {

    _userList;

    constructor() {
        this._userList = [];
    }

    addUser(name, priority) {
        if (this.getUserIdByName(name)) return false;

        let uuid = this._uuid(name);
        this._userList.push({
            name: name,
            uuid: uuid,
            priority: +priority,
            status: USER_STATUS.inactivated
        });
        return true;
    }

    getUserNameById(id) {
        return this._getUserById(id)?.name;
    }

    getUserIdByName(name) {
        return this._getUserByName(name)?.id;
    }

    _getUserByName(name) {
        return this._userList.find(user => user.name === name);
    }

    _getUserById(id) {
        return this._userList.find(user => user.uuid === id);
    }

    deleteUser(name) {
        let index = this._userList.findIndex(user => user.name === name);
        if (index > -1) {
            this._userList.splice(index, 1);
        }
    }

    activateUser(name) {
        let user = this._getUserByName(name);
        if (user) {
            user.status = USER_STATUS.activated;
        }
    }

    deactivateUser(name) {
        let user = this._getUserByName(name);
        if (user) {
            user.status = USER_STATUS.inactivated;
        }
    }

    getActivateUserNames() {
        return this._userList.filter(user => user.status === USER_STATUS.inactivated);
    }

    dispose() {
        this._userList = null;
    }

    _uuid(name) {
        let uuid = '', i, random;

        for (i = 0; i < name.length; i++) {
            random = Math.random() * 16 | 0;

            if (name[i] === '-') {
                uuid += '-';
            } else if (name[i] === 'x' || name[i] === 'X') {
                uuid += 'x';
            } else {
                uuid += (i === 8 || i === 13 || i === 18 || i === 23) ? '-' : '';
                uuid += random.toString(16);
            }
        }

        return uuid;
    }
}