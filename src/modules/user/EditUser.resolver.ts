import { Resolver, Mutation, Arg, ID, UseMiddleware, Ctx } from 'type-graphql';
import { UserInputError } from 'apollo-server-core';

import { ForbiddenError } from 'apollo-server-core';
import { UserDepartment } from '../../entity/UserDepartment';
import { MyContext } from './../../types/MyContext';

import { Dsf } from '../../entity/Dsf';
import { User } from '../../entity/User';
import { UserInput } from './register/UserInput';
import { isAuth } from '../middleware/isAuth';

@Resolver()
export class UpdateUserResolver {
	@UseMiddleware(isAuth)
	@Mutation(() => User)
	async updateUser(
		@Ctx() { req }: MyContext,
		@Arg('id', () => ID) id: string,
		@Arg('data')
		{
			netId,
			nineDigitId,
			firstName,
			lastName,
			email,
			phone,
			street1,
			street2,
			city,
			state,
			zip,
			password,
			dsf,
			admin,
		}: UserInput
	): Promise<User> {
		const { userId, isAdmin } = req.session!;
		if (!isAdmin) {
			const supervisedDepartment = await UserDepartment.findOne({
				userId,
				supervisor: true,
			});
			if (!supervisedDepartment) {
				throw new ForbiddenError('Not authorized.');
			}
		}

		const user = await User.findOne(id);

		if (!user) {
			throw new UserInputError('User not found.');
		}

		user.firstName = firstName;
		user.lastName = lastName;
		user.netId = netId;
		user.nineDigitId = nineDigitId;
		user.email = email;

		if (password) {
			user.password = password;
		}

		if (isAdmin) {
			user.admin = admin;
		}
		if (phone) {
			user.phone = phone;
		}
		if (street1) {
			user.street1 = street1;
		}
		if (street2) {
			user.street2 = street2;
		}
		if (city) {
			user.city = city;
		}
		if (state) {
			user.state = state;
		}
		if (zip) {
			user.zip = zip;
		}

		await user.save();

		// Update dsf
		if (dsf === true) {
			await Dsf.create({ userId: user.id }).save();
		} else if (dsf === false) {
			await Dsf.delete({ userId: id });
		}

		return user;
	}
}
