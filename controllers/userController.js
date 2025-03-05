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
export const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        const user = await userModel.findOne({ 
            resetPasswordToken: token, 
            resetPasswordExpires: { $gt: Date.now() } 
        });

        if (!user) {
            return res.status(400).json({ message: "Invalid or expired token" });
        }

        // Hash the new password
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedNewPassword;

        // Remove reset token
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();

        res.status(200).json({ message: "Password updated successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Something went wrong" });
    }
};
