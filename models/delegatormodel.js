class DelegatorModel {
    constructor(profileJson) {
        if(profileJson){
            try {
                this.id = profileJson.id
                if(profileJson.type.id == process.env.DELEGATED_USER_TYPE_ID){
                    this.displayName = profileJson.profile.firstName +
                     ' ' + profileJson.profile.lastName + 
                     ' (' +profileJson.profile.email + ')'
                }
                else if(profileJson.type.id == process.env.ENTITY_TYPE_ID){
                    this.displayName = profileJson.profile.entityName +
                    ' ' + profileJson.profile.entityId
                }
                else{
                    this.displayName = profileJson.profile.login
                } 
            }
            catch (error){
                console.log(error)
            }
        }
    }
}

module.exports = DelegatorModel