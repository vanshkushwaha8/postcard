import bcrypt from 'bcrypt'

export const hashedPassword =async (password)=>{
    try{
        const saltRounds =10;
       const passwordHashed = await bcrypt.hash(password,saltRounds);
       return passwordHashed;
    }catch(error){
        console.log(error)
    }
}

export const comparePasword =async (password,passwordHashed)=>{
    return  bcrypt.compare(password,passwordHashed);
}