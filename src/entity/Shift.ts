import { ObjectType, Field, ID, Int, Float } from 'type-graphql';
import {
	Entity,
	BaseEntity,
	PrimaryGeneratedColumn,
	Column,
	ManyToOne,
	JoinColumn,
	BeforeInsert,
	BeforeUpdate,
	LessThanOrEqual,
	MoreThanOrEqual,
} from 'typeorm';
import { Department } from './Department';
import { User } from './User';
import { UserInputError } from 'apollo-server-core';
import {
	parse,
	format,
	differenceInMinutes,
	endOfDay,
	isBefore,
	isAfter,
	getHours,
} from 'date-fns';
import { WorkStudy } from './WorkStudy';

@ObjectType()
@Entity()
export class Shift extends BaseEntity {
	@Field(() => ID)
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Field()
	@Column('timestamp with time zone')
	timeIn: Date;

	@Field({ nullable: true })
	@Column('timestamp with time zone', { nullable: true })
	timeOut: Date;

	@Field(() => Int, { nullable: true })
	@Column('int', { nullable: true })
	minutesElapsed: number;

	@Column()
	userId: string;

	@Column()
	deptId: string;

	@Field(() => Boolean)
	async workStudy(): Promise<boolean> {
		const period = await WorkStudy.findOne({
			userId: this.userId,
			deptId: this.deptId,
			startDate: LessThanOrEqual(format(this.timeIn, 'YYYY-MM-DD')),
			endDate: MoreThanOrEqual(format(this.timeIn, 'YYYY-MM-DD')),
		});

		if (period) {
			return true;
		}

		return false;
	}

	@Field(() => Float)
	async nightShiftMinutes(): Promise<number> {
		const midnight = endOfDay(this.timeIn);
		// If shift crosses midnight...
		if (isBefore(this.timeIn, midnight) && isAfter(this.timeOut, midnight)) {
			// If time out is before 7:00am...
			if (getHours(this.timeOut) < 7) {
				// Calc number of minutes passed since midnight.
				return differenceInMinutes(this.timeOut, midnight);
			} else {
				// Calc total number of minutes passed between midnight and cutoff (7:00am)
				return 7 * 60; // 7 hours in minutes
			}

			// Else if clock in is after midnight and before 7:00am...
		} else if (getHours(this.timeIn) < 7) {
			// If time out is before 7:00am...
			if (getHours(this.timeOut) < 7) {
				// Calc total minutes elapsed in shift.
				return differenceInMinutes(this.timeOut, this.timeIn);
			} else {
				// Calc total number of minutes passed between time in and cutoff (7:00am)
				let sevenAm = parse(this.timeIn).setHours(7, 0, 0);
				console.log('7am:', sevenAm);
				return differenceInMinutes(sevenAm, this.timeIn);
			}
		}

		return 0;
	}

	@Field(() => User)
	@ManyToOne(() => User, user => user.shiftConnection)
	@JoinColumn({ name: 'userId' })
	user: Promise<User>;

	@Field(() => Department)
	@ManyToOne(() => Department, dept => dept.shiftConnection)
	@JoinColumn({ name: 'deptId' })
	department: Promise<Department>;

	@BeforeInsert()
	@BeforeUpdate()
	async validateShiftTimeRange(): Promise<boolean> {
		const shift = await Shift.findOne({
			where: [
				// Time in is not between another shifts's time in and time out.
				{
					userId: this.userId,
					timeIn: LessThanOrEqual(this.timeIn),
					timeOut: MoreThanOrEqual(this.timeIn),
				},
				// Time out is not between another shifts's time in and time out.
				{
					userId: this.userId,
					timeIn: LessThanOrEqual(this.timeOut),
					timeOut: MoreThanOrEqual(this.timeOut),
				},
				// Time in and time out do not completely encapsulate another shift.
				{
					userId: this.userId,
					timeIn: MoreThanOrEqual(this.timeIn),
					timeOut: LessThanOrEqual(this.timeOut),
				},
			],
		});

		console.log('shift:', shift);

		if (shift && shift.id !== this.id) {
			throw new UserInputError('Overlapping shift already exists.');
		}

		return true;
	}

	@BeforeInsert()
	@BeforeUpdate()
	async validateTimeOut(): Promise<boolean> {
		console.log(this);
		if (this.timeOut && this.timeOut < this.timeIn) {
			throw new UserInputError('Time out must be after time in.');
		}

		return true;
	}

	@BeforeInsert()
	@BeforeUpdate()
	async updateMinutesElapsed(): Promise<void> {
		if (this.timeOut) {
			this.minutesElapsed = differenceInMinutes(
				parse(this.timeOut),
				parse(this.timeIn)
			);
		}
	}
}
