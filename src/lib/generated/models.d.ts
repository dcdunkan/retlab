export type DownloadModel = {
	id?: number;
	position?: number;
};
export type PushModel = {
	id?: number;
	msg: string;
	time: string;
	title: string;
};
export type SemRegError = {
	semester_id: Array<string>;
};
export type SemRegSuccessResponse = {
	error: string;
	login?: boolean;
	message: string;
	success?: boolean;
};
export type Semester = {
	id: string;
	name: string;
};
export type SuccessResponse = {
	error: string;
	login?: boolean;
	message: string;
	success?: boolean;
};
export namespace video {
	export type VideoResponse = {
		error: string;
		login?: boolean;
		videos: Array<Videos>;
	};
	export type Videos = {
		date: string;
		description: string;
		id: string;
		sem: string;
		subject: string;
		title: string;
		type?: number;
		url: string;
	};
}
export namespace updateprofile {
	export type UpdateProfile = {
		login?: boolean;
		success?: boolean;
		url: string;
	};
}
export namespace university {
	export type UniversityResult = {
		branch: string;
		code: string;
		credit: string;
		grade: string;
		month_year: string;
		name: string;
		pass_status: string;
		program: string;
		reg_no: string;
		semester: string;
	};
	export type UniversityResultResponse = {
		branch: string;
		earned_credit: string;
		error: string;
		program: string;
		reg_no: string;
		result: Array<UniversityResult>;
		semester: string;
		sgpa: string;
	};
}
export namespace tutorial {
	export type Tutorial = {
		can_download?: boolean;
		can_submit?: boolean;
		details: string;
		finish_time: string;
		id: string;
		issued_on: string;
		last_date: string;
		semester: string;
		status: string;
		subject: string;
		title: string;
		type: string;
		uploaded_file: string;
		url: string;
	};
	export type TutorialResponse = {
		login?: boolean;
		message: string;
		tutorials: Array<Tutorial>;
	};
}
export namespace transportpalai {
	export type BusPass = {
		admission_no: string;
		batch: string;
		boarding: string;
		category: string;
		duration: string;
		error: string;
		full_name: string;
		gender: string;
		login?: boolean;
		pass_code: string;
		photo_url: string;
		program: string;
		qr_code: string;
		route: string;
		semester: string;
		url: string;
		validity: string;
	};
	export namespace registration {
		export type Boardings = {
			id?: number;
			name: string;
		};
		export type History = {
			id: string;
			name: string;
			reg_date: string;
			start_date: string;
			status: string;
			year: string;
		};
		export type RegisterSucessResponse = {
			error: string;
			login?: boolean;
			message: string;
			success?: boolean;
		};
		export type RegisterViewResponse = {
			admission_no: string;
			batch: string;
			boardings: Array<Boardings>;
			full_name: string;
			history: Array<History>;
			login?: boolean;
		};
	}
}
export namespace transport {
	export type TransportFeeResponse = {
		boarding_point: string;
		error: string;
		installments: Array<TransportInstallments>;
		login?: boolean;
		student_id: string;
		years: Array<transportpalai.registration.Boardings>;
	};
	export type TransportHistory = {
		adjustment: string;
		amount: string;
		balance?: number;
		paid: string;
		particular: string;
	};
	export type TransportHistoryResponse = {
		history: Array<TransportHistory>;
		login?: boolean;
	};
	export type TransportInstallments = {
		adjustment: string;
		amount: string;
		balance?: number;
		fullpaid?: boolean;
		head_id: string;
		installment_id: string;
		paid: string;
		particular: string;
		totalAmount?: number;
	};
	export type TransportPayUrl = {
		fine: string;
		total: string;
		url: string;
	};
	export type TransportYear = {
		id?: number;
		name: string;
	};
}
export namespace timetable {
	export type TimeTable = {
		subject?: string;
		timeperiod?: string;
		type?: string;
	};
	export type TimeTablePeriod = {
		day: string;
		sub: Array<TimeTable>;
	};
	export type TimetableResponse = {
		error: string;
		login?: boolean;
		timetable: Array<TimeTablePeriod>;
	};
	export namespace special {
		export type SpecialResponse = {
			date: string;
			period: string;
			subject: string;
			teacher: string;
		};
	}
	export namespace change {
		export type ChangeTimeTableResponse = {
			date: string;
			inplace: string;
			period: string;
			teacher: string;
		};
	}
}
export namespace survey {
	export type GenSurveyQuestionRequest = {
		survey_id?: string;
	};
	export type SubmitResponse = {
		response: string;
		status: string;
	};
	export type Survey = {
		btn_status: string;
		complete?: boolean;
		last_date: string;
		name: string;
		session: string;
		survey_id: string;
		type: string;
	};
	export type SurveyAnswer = {
		answer: string;
		qid: string;
		type: string;
	};
	export type SurveyQuestion = {
		check?: Array<string>;
		id?: Array<string>;
		option?: Array<string>;
		qid?: string;
		question?: string;
		required?: string;
		type?: string;
	};
	export type SurveyRequest = {
		subject_id?: string;
		survey_id?: string;
		teacher_id?: string;
	};
	export type TeacherList = {
		btn_msg: string;
		image: string;
		semester: string;
		status: string;
		subject: string;
		subject_id: string;
		teacher: string;
		teacher_id: string;
	};
	export namespace posurvey {
		export type POSurvey = {
			btn: string;
			end_date: string;
			id: string;
			session: string;
			start_date: string;
			status: string;
			survey: string;
		};
		export type POSurveyResponse = {
			posurvey: Array<POSurvey>;
		};
		export type PoOptions = {
			option_id: string;
			option_name: string;
		};
		export type PoQuestions = {
			answer: string;
			options: Array<PoOptions>;
			q_id: string;
			q_name: string;
			required?: boolean;
		};
		export type PoQuestionsResponse = {
			period: string;
			questions: Array<PoQuestions>;
			survey: string;
			type: string;
		};
	}
	export namespace graduateexit {
		export type DoGraduateSurveyQuestions = {
			answer_id: string;
			option_id: string;
			options: Array<GEOptions>;
			q_id: string;
			question: string;
			required?: boolean;
			section: string;
			type: string;
		};
		export type DoGraduateSurveyResponse = {
			gequestions: Array<DoGraduateSurveyQuestions>;
		};
		export type GEOptions = {
			option: string;
			option_id: string;
		};
		export type GraduateExitSurveyList = {
			btn: string;
			end_date: string;
			session: string;
			session_id: string;
			slno?: number;
			start_date: string;
			status: string;
			survey: string;
			survey_id: string;
		};
		export type GraduateExitSurveyListResponse = {
			gesurvey: Array<GraduateExitSurveyList>;
		};
	}
	export namespace courseevaluation {
		export type CourseSurvey = {
			btn: string;
			end_date: string;
			session: string;
			session_id: string;
			slno?: number;
			start_date: string;
			status: string;
			survey: string;
		};
		export type CourseSurveyOptions = {
			option: string;
			option_id: string;
		};
		export type CourseSurveyQuestions = {
			answer_id: string;
			options: Array<CourseSurveyOptions>;
			q_id: string;
			question: string;
			required?: boolean;
			slno?: number;
		};
		export type CourseSurveyQuestionsResponse = {
			login?: boolean;
			questions: Array<CourseSurveyQuestions>;
		};
		export type CourseSurveyResponse = {
			login?: boolean;
			survey: Array<CourseSurvey>;
		};
		export type DoCourseSurvey = {
			btn: string;
			id: string;
			name: string;
			slno?: number;
			status: string;
		};
		export type DoCourseSurveyResponse = {
			description: string;
			login?: boolean;
			period: string;
			session: string;
			subjects: Array<DoCourseSurvey>;
			type: string;
		};
	}
}
export namespace subjectregistration {
	export type Category = {
		name: string;
		subjects: Array<Subject>;
	};
	export type PathWay = {
		id?: number;
		name: string;
	};
	export type SemList = {
		sem_pos?: number;
		subjects: Array<SubjectMainList>;
	};
	export type SemSubList = {
		ans: string;
		id?: number;
		name: string;
	};
	export type SemSubjects = {
		group: string;
		mark: string;
		subject_name: string;
	};
	export type SemesterList = {
		mdc_subjects: Array<SemSubjects>;
		minor_subjects: Array<SemSubjects>;
		seme_pos: string;
		sgpa: string;
	};
	export type StatusList = {
		name: string;
		status: string;
	};
	export type Subject = {
		id: string;
		name: string;
		preference: string;
		status: string;
	};
	export type SubjectMainList = {
		ans: string;
		mark: string;
		name: string;
		sem_id?: number;
		subjects: Array<SemSubList>;
	};
	export type SubjectRegistration = {
		added_at: string;
		category: string;
		id: string;
		semester: string;
		status: Array<StatusList>;
	};
	export type SubjectRegistrationResponse = {
		data: Array<SubjectRegistration>;
		error: string;
	};
	export type SubjectSpinner = {
		id?: number;
		name: string;
	};
	export type SubjectSpinnerResponse = {
		additionalelective_1: Array<SubjectSpinner>;
		additionalelective_2: Array<SubjectSpinner>;
		additionalelective_3: Array<SubjectSpinner>;
		aec_1: Array<SubjectSpinner>;
		aec_2: Array<SubjectSpinner>;
		aec_3: Array<SubjectSpinner>;
		dsc_1: Array<SubjectSpinner>;
		dsc_2: Array<SubjectSpinner>;
		dsc_3: Array<SubjectSpinner>;
		elective_1: Array<SubjectSpinner>;
		elective_2: Array<SubjectSpinner>;
		elective_3: Array<SubjectSpinner>;
		globalelective: Array<SubjectSpinner>;
		honour: Array<SubjectSpinner>;
		mdc_1: Array<SubjectSpinner>;
		mdc_2: Array<SubjectSpinner>;
		mdc_3: Array<SubjectSpinner>;
		minor_1: Array<SubjectSpinner>;
		minor_2: Array<SubjectSpinner>;
		minor_3: Array<SubjectSpinner>;
	};
	export type Subjects = {
		ans: string;
		id?: number;
		name: string;
	};
	export type SubjectsList = {
		id?: number;
		name: string;
		subjects: Array<Subjects>;
	};
	export type SubjectsListResponse = {
		category: Array<PathWay>;
		pathway: Array<PathWay>;
		sem_list: Array<SemList>;
		subject_list: Array<SubjectsList>;
	};
	export type ViewSubjectRegistrationResponse = {
		admission_no: string;
		can_update?: boolean;
		category: string;
		data: Array<Category>;
		full_name: string;
		path_way: string;
		previousdata: Array<SemesterList>;
		sem_id: string;
		semester: string;
	};
}
export namespace subject {
	export type Subjects = {
		atten_per: string;
		atten_text: string;
		isSubGe?: boolean;
		sub_id: string;
		sub_name: string;
		teacher_name: string;
	};
	export namespace syllabus {
		export type Syllabus = {
			module: string;
			topics: Array<Topic>;
		};
		export type SyllabusResponse = {
			syllabus: Array<Syllabus>;
		};
		export type Topic = {
			topic: string;
		};
	}
	export namespace coverage {
		export type SubCovTopic = {
			is_covered?: boolean;
			topic_name: string;
		};
		export type SubCoverage = {
			module: string;
			ratio?: number;
			topic: Array<SubCovTopic>;
		};
		export type SubCoverageResponse = {
			coverage: Array<SubCoverage>;
			login?: boolean;
		};
	}
	export namespace co {
		export type CoModel = {
			co_id: string;
			topic: string;
		};
		export type CoSyllabusRequest = {
			sub_id: string;
		};
	}
}
export namespace store {
	export type SemesterListRequest = {
		dept_id: string;
	};
	export type Store = {
		name: string;
		price: string;
	};
	export type StoreRequest = {
		subject_id: string;
	};
	export type StoreResponse = {
		data: Array<Store>;
		login?: boolean;
		success?: boolean;
	};
	export namespace departmentlist {
		export type DepartmentList = {
			id: string;
			name: string;
		};
		export type DepartmentListResponse = {
			data: Array<DepartmentList>;
			login?: boolean;
			success?: boolean;
		};
	}
}
export namespace stationary {
	export type AdvancePaymentResponse = {
		login?: boolean;
		success?: boolean;
		url: string;
	};
	export type StationaryItem = {
		category_id: string;
		category_name: string;
		id: string;
		name: string;
		pre_url: string;
		price: string;
		subcategory_id: string;
		subcategory_name: string;
	};
	export type StationaryItemResponse = {
		data: Array<StationaryItem>;
	};
	export type StationaryReceipt = {
		create_time: string;
		created_user: string;
		id: string;
		method: string;
		print_url: string;
		receipt_date: string;
		receipt_no: string;
		status: string;
		total_amount: string;
		view_url: string;
	};
	export type StationaryReceiptResponse = {
		data: Array<StationaryReceipt>;
		login?: boolean;
	};
}
export namespace semregistration {
	export type AcademicYear = {
		id?: number;
		name: string;
	};
	export type AcademicYearResponse = {
		additional_electives: Array<AcademicYear>;
		electives: Array<AcademicYear>;
		globalelectives: Array<AcademicYear>;
		honours: Array<AcademicYear>;
		login?: boolean;
		minors: Array<AcademicYear>;
		program_electives: Array<AcademicYear>;
		semester: string;
		semester_id: string;
	};
	export type SemRegViewResponse = {
		academic_due: string;
		academic_due_details: string;
		accounts_due: string;
		accounts_due_details: string;
		admission_no: string;
		amount_paid: string;
		backpaper: string;
		backlogs_count: string;
		bank_name: string;
		bus_due: string;
		bus_due_details: string;
		can_edit?: boolean;
		can_edit_message: string;
		classteacher_remarks: string;
		department_due: string;
		department_due_details: string;
		earned_credits: string;
		email: string;
		exam_appear: string;
		exam_month_year: string;
		fee_concession: string;
		fee_concession_category: string;
		fee_exemption?: boolean;
		fee_paid: string;
		feereceipt_file: string;
		gender: string;
		hod_remarks: string;
		hostel_due: string;
		hostel_due_details: string;
		is_applied?: boolean;
		last_attended_sem: string;
		last_attended_sem_text: string;
		library_due: string;
		librarary_due_details: string;
		login?: boolean;
		name: string;
		payment_date: string;
		payment_mode: string;
		payment_reference_no: string;
		phone: string;
		regslip_file: string;
		sem_applied_for: string;
		sem_list: Array<Semester>;
		sem_registration_status?: boolean;
		sem_registration_status_message: string;
		status: string;
		unireg_no: string;
		update_btn?: boolean;
	};
	export namespace view {
		export type SemRegSlip = {
			login?: boolean;
			regslip_file: string;
			success?: boolean;
		};
	}
	export namespace list {
		export type RegisterList = {
			date: string;
			id: string;
			semester_applied_from: string;
			status: string;
		};
		export type SemRegisterListResponse = {
			due_status?: boolean;
			sem_registration_error: string;
			fee_exemption?: boolean;
			fee_paid?: boolean;
			hostel_due_message: string;
			hostel_due_status?: boolean;
			login?: boolean;
			register_list: Array<RegisterList>;
			sem_registration_status?: boolean;
			sem_registration_status_message: string;
		};
	}
}
export namespace result {
	export type ResultAssignment = {
		max_mark: string;
		name: string;
		obtained_mark: string;
		subject: string;
	};
	export type ResultInternal = {
		max_mark: string;
		obtained_mark: string;
		subject: string;
	};
	export type ResultSeasonal = {
		max_mark: string;
		obtained_mark: string;
		subject: string;
	};
	export type SeasonRequest = {
		sem_id: string;
		session: string;
	};
	export namespace univ {
		export type UnivDetails = {
			cgpa?: string;
			credit?: string;
			pass_status?: string;
			sgpa?: string;
			total_internal?: string;
		};
		export type UnivExamSubjects = {
			attendance?: string;
			credits?: string;
			internal_mark?: string;
			status?: string;
			subject?: string;
			univ_mark?: string;
		};
		export type UnivExams = {
			exam_name: string;
			subjects: Array<UnivExamSubjects>;
		};
		export type UnivResponse = {
			details: UnivDetails;
			error: string;
			login?: boolean;
			subjects: Array<UnivSubjects>;
			univ_exams: Array<UnivExams>;
		};
		export type UnivSubjects = {
			status?: string;
			subject?: string;
		};
	}
	export namespace tutorial {
		export type TutorialResult = {
			mark: string;
			subject: string;
			title: string;
		};
		export type TutorialResultResponse = {
			error: string;
			login?: boolean;
			tutorials: Array<TutorialResult>;
		};
	}
	export namespace moduletest {
		export type ResultModuleTest = {
			mark: string;
			subject: string;
		};
		export type ResultModuleTestResponse = {
			login?: boolean;
			module_test: Array<ResultModuleTest>;
		};
	}
}
export namespace resetpassword {
	export type ResetPassword = {
		url: string;
	};
	export type ResetPasswordResponse = {
		resets: Array<ResetPassword>;
	};
}
export namespace quiz {
	export type OptionsNew = {
		id: string;
		option: string;
	};
	export type QuestionsNew = {
		answer_id?: string;
		duration_in_seconds?: string;
		id?: string;
		file?: string;
		is_attended?: boolean;
		options: Array<OptionsNew>;
		qno?: string;
		question_text: string;
		question_type?: string;
		session_id?: string;
		user_answer?: string;
	};
	export type QuestionsNewResponse = {
		questions: Array<QuestionsNew>;
	};
	export namespace submit {
		export type QuizFinishRequest = {
			final_submit: string;
			option?: string;
			qno?: string;
		};
		export type QuizSubmitResponse = {
			is_ongoing?: boolean;
			is_started?: boolean;
			is_finished?: boolean;
			success?: boolean;
		};
		export type SubmitRequest = {
			option?: string;
			qno?: string;
		};
	}
	export namespace result {
		export type QuizResultResponse = {
			descriptive_questions: Array<quiz.result.descriptive.DescriptiveQuestions>;
			file_upload_questions: Array<quiz.result.filetype.FileTypeQuestions>;
			has_result_published?: boolean;
			has_student_attended?: boolean;
			login?: boolean;
			marks_scored: string;
			multiple_choice_questions: Array<quiz.result.mcq.McqQuestions>;
			question_set_name: string;
		};
		export namespace mcq {
			export type McqOptions = {
				id?: string;
				option_content?: string;
			};
			export type McqQuestions = {
				correct_option_id?: string;
				is_answer_correct?: boolean;
				is_attended?: boolean;
				mark_obtained?: string;
				question_content?: string;
				question_no?: string;
				question_options: Array<McqOptions>;
				user_opted_option_id?: string;
			};
		}
		export namespace filetype {
			export type FileTypeQuestions = {
				file: Array<QuizResultFile>;
				is_attended?: boolean;
				mark_obtained?: string;
				question_content?: string;
				question_no?: string;
			};
			export type QuizResultFile = {
				name?: string;
				path?: string;
			};
		}
		export namespace descriptive {
			export type DescriptiveQuestions = {
				is_attended?: boolean;
				mark_obtained?: string;
				question_content?: string;
				question_no?: string;
				student_answer?: string;
			};
		}
	}
	export namespace questions {
		export type Options = {
			id?: string;
			option?: string;
		};
		export type QuestionResponse = {
			questions: Array<Questions>;
		};
		export type Questions = {
			answer_id?: string;
			duration_in_seconds?: string;
			id?: string;
			file?: string;
			is_attended?: boolean;
			options: Array<Options>;
			qno?: string;
			question_text?: string;
			question_type?: string;
			session_id?: string;
			user_answer?: string;
		};
	}
	export namespace list {
		export type Quiz = {
			description: string;
			end_time: string;
			id: string;
			isCompleted?: boolean;
			isOnGoing?: boolean;
			isResultPublished?: boolean;
			isStarted?: boolean;
			max_mark: string;
			name: string;
			start_time: string;
			statusText: string;
			type: string;
			typeText: string;
		};
		export type QuizResponse = {
			quizes: Array<Quiz>;
		};
	}
	export namespace file {
		export type QuizDeleteFile = {
			file_id: string;
		};
		export type QuizFileUploadResponse = {
			delete_url: string;
			id: string;
			name: string;
			url: string;
		};
	}
}
export namespace programoutcome {
	export type ProgramOutcome = {
		content: string;
		heading: string;
	};
	export type ProgramOutcomeResponse = {
		login?: boolean;
		pgm_educational: Array<ProgramOutcome>;
		pgm_outcomes: Array<ProgramOutcome>;
		pgm_specific: Array<ProgramOutcome>;
	};
}
export namespace profileasiet {
	export namespace sport {
		export type Sport = {
			awards: string;
			date: string;
			event: string;
			file: string;
			id: string;
			level: string;
			name: string;
			organized_by: string;
			type: string;
			year: string;
		};
		export type SportResponse = {
			login?: boolean;
			participation: Array<Sport>;
		};
	}
	export namespace scholarships {
		export type Scholarships = {
			id: string;
			name: string;
			type: string;
			year: string;
		};
		export type ScholarshipsResponse = {
			login?: boolean;
			scholarship: Array<Scholarships>;
		};
	}
	export namespace qualifiedexamination {
		export type QualifiedExamination = {
			file: string;
			id: string;
			name: string;
			score: string;
			year: string;
		};
		export type QualifiedExaminationResponse = {
			examination: Array<QualifiedExamination>;
			login?: boolean;
		};
	}
	export namespace publication {
		export type Publication = {
			conference: string;
			file: string;
			id: string;
			index: string;
			journal: string;
			title: string;
			year: string;
		};
		export type PublicationDropDown = {
			id?: number;
			name: string;
		};
		export type PublicationDropDownResponse = {
			category: Array<PublicationDropDown>;
			index: Array<PublicationDropDown>;
			level: Array<PublicationDropDown>;
			login?: boolean;
			membership: Array<PublicationDropDown>;
			nature: Array<PublicationDropDown>;
			project: Array<PublicationDropDown>;
			scholarship: Array<PublicationDropDown>;
			sem_id: string;
			sem_name: string;
			years: Array<PublicationDropDown>;
		};
		export type PublicationResponse = {
			login?: boolean;
			publications: Array<Publication>;
		};
	}
	export namespace projectwork {
		export type ProjectWork = {
			details: string;
			file: string;
			id: string;
			type: string;
			year: string;
		};
		export type ProjectWorkResponse = {
			login?: boolean;
			project: Array<ProjectWork>;
		};
	}
	export namespace positionheld {
		export type PositionHeld = {
			end: string;
			id: string;
			name: string;
			start: string;
			year: string;
		};
		export type PositionHeldResponse = {
			login?: boolean;
			positions: Array<PositionHeld>;
		};
	}
	export namespace mooccourse {
		export type MoocCourse = {
			achievements: string;
			duration: string;
			file: string;
			from_date: string;
			id: string;
			name: string;
			platform: string;
			to_date: string;
		};
		export type MoocCourseResponse = {
			login?: boolean;
			mooc: Array<MoocCourse>;
		};
	}
	export namespace membership {
		export type Membership = {
			description: string;
			file: string;
			id: string;
			member_id: string;
			member_since: string;
			name: string;
			type: string;
		};
		export type MembershipResponse = {
			login?: boolean;
			professionalsociety: Array<Membership>;
		};
	}
	export namespace fundedresearch {
		export type FundedResearch = {
			agency: string;
			amount: string;
			duration: string;
			file: string;
			id: string;
			title: string;
			year: string;
		};
		export type FundedResearchResponse = {
			funded: Array<FundedResearch>;
			login?: boolean;
		};
	}
	export namespace coursesattended {
		export type CoursesAttended = {
			achievements: string;
			duration: string;
			file: string;
			from_date: string;
			id: string;
			name: string;
			organized_by: string;
			to_date: string;
			year: string;
		};
		export type CoursesAttendedResponse = {
			courses: Array<CoursesAttended>;
			login?: boolean;
		};
	}
	export namespace achievements {
		export type Achievements = {
			file: string;
			id: string;
			name: string;
			year: string;
		};
		export type AchievementsResponse = {
			achievement: Array<Achievements>;
			login?: boolean;
		};
	}
}
export namespace placement {
	export type Placement = {
		btn?: boolean;
		date: string;
		description: string;
		id: string;
		last_date: string;
		name: string;
		status: string;
	};
	export type PlacementRequest = {
		placement_id: string;
	};
}
export namespace onlineclass {
	export type OnlineClass = {
		sub_name: string;
		suburl: string;
	};
	export type OnlineClassResponse = {
		batch: string;
		batchvideourl: string;
		error: string;
		login?: boolean;
		subjects: Array<OnlineClass>;
		semester: string;
	};
}
export namespace noticeboard {
	export type Notice = {
		content: string;
		"create by": string;
		"created time": string;
		document: string;
		heading: string;
	};
	export type NoticeJecc = {
		content: string;
		"create by": string;
		"created time": string;
		document: string;
		heading: string;
	};
	export type NoticeJeccResponse = {
		error: string;
		login?: boolean;
		notice: Array<NoticeJecc>;
	};
	export type NoticeResponse = {
		error: string;
		login?: boolean;
		notice: Array<Notice>;
	};
}
export namespace message {
	export type Inbox = {
		content: string;
		date: string;
		from: string;
		id: string;
		is_read: string;
		sender_id: string;
		subject: string;
	};
	export type MsgHandleRequest = {
		id: string;
	};
	export type Outbox = {
		content: string;
		date: string;
		id: string;
		subject: string;
		to: string;
	};
	export type ReplyRequest = {
		message: string;
		reply_for_id?: string;
		to_id?: string;
	};
}
export namespace mess {
	export type Mess = {
		day: string;
		items: Array<MessMenu>;
	};
	export type MessData = {
		booking_date: string;
		day: string;
		day_id: string;
	};
	export type MessItem = {
		id: string;
		max_qty: string;
		name: string;
	};
	export type MessMenu = {
		max_qty: string;
		menu: string;
		type?: number;
		type_name: string;
	};
	export type MessMenuResponse = {
		item: Array<MessItem>;
		login?: boolean;
	};
	export type MessResponse = {
		data: Array<Mess>;
		login?: boolean;
	};
	export type MessType = {
		id: string;
		name: string;
	};
	export type MessTypeResponse = {
		data: Array<MessData>;
		login?: boolean;
		type: Array<MessType>;
	};
	export type OrderHistory = {
		booking_date: string;
		id: string;
		menu: string;
		quantity: string;
		status: string;
		type: string;
	};
	export type OrderHistoryResponse = {
		data: Array<OrderHistory>;
		login?: boolean;
	};
}
export namespace materials {
	export type DownloadMaterial = {
		url: string;
	};
	export type DownloadMaterialResponse = {
		files: Array<DownloadMaterial>;
	};
	export type MaterialRequest = {
		sem_id: string;
	};
	export type Materials = {
		date: string;
		link: string;
		module: string;
		semester: string;
		subject: string;
		title: string;
		url: string;
	};
	export type MaterialsNew = {
		date: string;
		download: string;
		link: string;
		module: string;
		semester: string;
		subject: string;
		title: string;
		url: Array<string>;
	};
}
export namespace main {
	export type ApplyHostelResponse = {
		error: string;
		hostel?: number;
		hostel_status: string;
		login?: boolean;
		success?: boolean;
	};
	export type CourseSurveyPending = {
		coursesurvey_status?: boolean;
	};
	export type FeeStatusResponse = {
		error: string;
		login?: boolean;
		status?: boolean;
	};
	export type POSurveyPending = {
		posurvey_status?: boolean;
	};
	export type PushRequest = {
		platform: string;
		token: string;
	};
	export type PushResponse = {
		error: string;
		login?: boolean;
		success?: boolean;
	};
	export type SurveyMandatory = {
		login?: boolean;
		survey_mandatory?: boolean;
	};
	export type SurveyPending = {
		profile_status?: boolean;
		semreg_default?: boolean;
		survey_status?: boolean;
	};
}
export namespace login {
	export type LoginRequest = {
		hostel?: string;
		password: string;
		username: string;
	};
	export type LoginResponse = {
		academic_year: string;
		access_token: string;
		batch_id: string;
		course: string;
		end_year?: number;
		error: string;
		hostel?: number;
		hostel_status: string;
		isktu?: boolean;
		login?: boolean;
		logout_status: string;
		password: string;
		url: string;
		profile_name: string;
		sem_id: string;
		sem_name: string;
		start_year?: number;
		univ: string;
		user_type: string;
		uname: string;
	};
	export type LogoutRequest = {
		push_token: string;
	};
}
export namespace live {
	export type Live = {
		date: string;
		details: string;
		link: string;
		title: string;
		type: string;
	};
	export type LiveResponse = {
		live: Array<Live>;
		login?: boolean;
	};
}
export namespace library {
	export type BookRecord = {
		due_date: string;
		fine: string;
		is_paid: string;
		issue_date: string;
		remarks: string;
		renewal_date: string;
		returned_date: string;
		slno: string;
		status: string;
		title: string;
	};
	export type BookRecordResponse = {
		book_record: Array<BookRecord>;
		login?: boolean;
	};
	export type Books = {
		author: string;
		bookid: string;
		category: string;
		distribution: string;
		edition: string;
		isbn: string;
		location: string;
		name: string;
		slno: string;
		status: string;
		title: string;
	};
	export type BooksResponse = {
		books: Array<Books>;
		login?: boolean;
	};
}
export namespace leavemanagement {
	export type LeaveManagement = {
		allocated_leave: string;
		balance?: number;
		id?: number;
		leave_type: string;
		staff_id: string;
		taken?: number;
	};
	export type LeaveManagementResponse = {
		leave_data: Array<LeaveManagement>;
		login?: boolean;
		success?: boolean;
	};
}
export namespace leave {
	export namespace medical {
		export type MedicalLeave = {
			datefrom: string;
			dateto: string;
			reason: string;
			remark: string;
			status: string;
		};
		export type MedicalRequest = {
			from_date: string;
			to_date: string;
			reason: string;
		};
	}
	export namespace duty {
		export type DutyLeave = {
			btn_status?: boolean;
			description: string;
			id: string;
			l_date: string;
			name: string;
			proof_status?: boolean;
			proof_url: string;
			status: string;
			type: string;
		};
		export type DutyLeaveDate = {
			date: string;
			hours: Array<DutyLeaveHour>;
			selected?: boolean;
		};
		export type DutyLeaveDateResponse = {
			data: Array<DutyLeaveDate>;
			login?: boolean;
		};
		export type DutyLeaveDirectApply = {
			from_date: string;
			head: string;
			id: string;
			reason: string;
			status: string;
			to_date: string;
			url: string;
		};
		export type DutyLeaveDirectApplyResponse = {
			data: Array<DutyLeaveDirectApply>;
			login?: boolean;
		};
		export type DutyLeaveHead = {
			id?: number;
			name: string;
		};
		export type DutyLeaveHeadResponse = {
			data: Array<DutyLeaveHead>;
			login?: boolean;
		};
		export type DutyLeaveHour = {
			hour?: number;
			status: string;
		};
		export type DutyLeaveViewRequest = {
			filter: string;
		};
	}
}
export namespace lab {
	export type Evaluation = {
		output: string;
		record: string;
		topic: string;
		viva: string;
	};
	export type LabDue = {
		amount: string;
		due_date: string;
		equipment: string;
		lab: string;
		paid_date: string;
		paid_status: string;
	};
	export type LabEquipRequest = {
		lid?: string;
	};
	export type LabEquipment = {
		asset_type: string;
		facility_name: string;
		status: string;
		type: string;
	};
	export type LabList = {
		id: string;
		laboratary_name: string;
	};
	export type Practical = {
		atten_text: string;
		sub_id: string;
		sub_pid: string;
		subject: string;
	};
	export type PracticalRequest = {
		sub_id?: string;
		sub_pid?: string;
	};
}
export namespace internship {
	export type Internship = {
		completion_certificate: string;
		from_date: string;
		id: string;
		name: string;
		slno: string;
		status: string;
		to_date: string;
		url: string;
		verified_certificate: string;
	};
	export type InternshipResponse = {
		data: Array<Internship>;
		login?: boolean;
	};
	export namespace companylist {
		export type CompanyList = {
			id: string;
			name: string;
		};
		export type CompanyListResponse = {
			companies: Array<CompanyList>;
			login?: boolean;
		};
	}
}
export namespace institutions {
	export type Colleges = {
		base_url: string;
		clgId: string;
		clgName: string;
		regUrl: string;
	};
	export type Institution = {
		colleges: Array<Colleges>;
	};
}
export namespace hostelnew {
	export type HostelNewAdmission = {
		amount?: number;
		balance?: number;
		fine?: number;
		installment: string;
		is_selected?: boolean;
		m: string;
		month: string;
		paid?: number;
		payment: Array<hostel.HostelFee>;
		y: string;
		year: string;
	};
	export type HostelNewAdmissionResponse = {
		date: string;
		fine: string;
		hostel: Array<HostelNewAdmission>;
		login?: boolean;
	};
	export type HostelNewHistory = {
		adjustment?: number;
		amount?: number;
		balance?: number;
		installment: string;
		paid?: number;
		wallet?: number;
	};
	export type HostelNewHistoryResponse = {
		admission_history: Array<HostelNewHistory>;
		login?: boolean;
		monthly_history: Array<HostelNewHistory>;
	};
	export type HostelNewMonthly = {
		amount?: number;
		balance?: number;
		fine?: number;
		installment: string;
		is_selected?: boolean;
		m: string;
		month: string;
		paid?: number;
		payment: Array<hostel.HostelFee>;
		y: string;
		year: string;
	};
	export type HostelNewMonthlyResponse = {
		date: string;
		fine: string;
		hostel: Array<HostelNewMonthly>;
		login?: boolean;
	};
	export type HostelNewPay = {
		fine?: number;
		subtotal?: number;
		total_amount?: number;
		url: string;
	};
	export type HostelStatusNew = {
		allpayment?: boolean;
		login?: boolean;
	};
}
export namespace hostel {
	export type HostelFee = {
		adjustment?: number;
		amount: string;
		balance?: number;
		feegroup_id: string;
		feehead_id: string;
		feeheadgroup_id: string;
		feetype: string;
		fine?: number;
		hostel_id: string;
		installment?: number;
		name: string;
		paid?: number;
		payable?: number;
		scholarship: string;
		status?: number;
		tenant_id: string;
		user_id: string;
	};
	export type HostelFeePalaiResponse = {
		fine?: number;
		subtotal?: number;
		total?: number;
		url: string;
	};
	export type HostelFeeRequest = {
		transaction_method: string;
		month: string;
		year: string;
	};
	export type HostelFeeResponse = {
		url: string;
	};
	export type HostelFeeTypes = {
		id?: number;
		name: string;
	};
	export type HostelMonth = {
		amount?: number;
		balance?: number;
		diff: string;
		fine: string;
		installment: string;
		is_selected?: boolean;
		m: string;
		month: string;
		paid?: number;
		payment: Array<HostelFee>;
		y: string;
		year: string;
	};
	export type HostelMonthResponse = {
		date: string;
		hostel: Array<HostelMonth>;
		login?: boolean;
	};
	export type HostelPalaiAdmission = {
		amount?: number;
		balance?: number;
		diff: string;
		fine?: number;
		installment: string;
		is_selected?: boolean;
		m: string;
		month: string;
		paid?: number;
		payment: Array<HostelFee>;
		scholarship: string;
		y: string;
		year: string;
	};
	export type HostelPalaiAdmissionResponse = {
		date: string;
		fine: string;
		hostel: Array<HostelPalaiAdmission>;
		login?: boolean;
		method: string;
		types: Array<HostelFeeTypes>;
	};
	export type HostelPalaiMonth = {
		amount?: number;
		balance?: number;
		diff: string;
		fine: string;
		installment: string;
		m: string;
		month: string;
		paid?: number;
		payment: Array<HostelFee>;
		y: string;
		year: string;
	};
	export type HostelPalaiResponse = {
		date: string;
		hostel: Array<HostelPalaiMonth>;
		login?: boolean;
	};
	export type HostelPalaiTypesResponse = {
		login?: boolean;
		types: Array<HostelFeeTypes>;
	};
	export type HostelResponse = {
		hostel: string;
		installment: string;
		join_date: string;
		month: string;
		name: string;
		room_no: string;
		year: string;
	};
	export namespace receipt {
		export type HostelReceipt = {
			amount: string;
			feeReceiptNo: string;
			hostel: string;
			installment: string;
			receipt_date: string;
			receipt_url: string;
		};
		export type HostelReceiptResponse = {
			receipts: Array<HostelReceipt>;
		};
	}
	export namespace partial {
		export namespace admission {
			export type HostelPartialAdmission = {
				date: string;
				fine: string;
				login?: boolean;
				payment: Array<HostelPartialPayment>;
			};
			export type HostelPartialAdmissionResponse = {
				date: string;
				fine: string;
				hostel: Array<HostelPartialAdmission>;
				login?: boolean;
				method: string;
				types: Array<hostel.HostelFeeTypes>;
			};
			export type HostelPartialPayment = {
				amount: string;
				balance?: number;
				feehead_id: string;
				feeheadgroup_id: string;
				feetype: string;
				hostel_id: string;
				installment?: number;
				is_selected?: boolean;
				m: string;
				name: string;
				paid?: number;
				payable?: number;
				scholarship?: number;
				status?: number;
				tenant_id: string;
				user_id: string;
				y: string;
			};
		}
	}
	export namespace mits {
		export type MitsFeePay = {
			login?: boolean;
			url: string;
		};
	}
	export namespace gcekhostel {
		export namespace reregistration {
			export type PresentHostel = {
				id?: number;
				name: string;
			};
			export type PresentHostelResponse = {
				hostel: Array<PresentHostel>;
				login?: boolean;
			};
		}
		export namespace registration {
			export type Registration = {
				added_at: string;
				id: string;
				print: string;
				reg_type: string;
				semester: string;
				status: string;
			};
			export type RegistrationResponse = {
				is_hostler?: boolean;
				login?: boolean;
				re_admission?: boolean;
				reg: Array<Registration>;
			};
			export type ViewRegistrationResponse = {
				admission_no: string;
				admsn_type: string;
				annual_income: string;
				blood_group: string;
				caste: string;
				category: string;
				distance: string;
				full_name: string;
				guardian_address: string;
				incomeFile: string;
				login?: boolean;
				phone_guardian: string;
				phone_no: string;
				punishment: string;
				readmission: string;
				religion: string;
				remarks: string;
				semester: string;
				status: string;
				type: string;
			};
		}
		export namespace newregistration {
			export type CategoryType = {
				id?: number;
				name: string;
			};
			export type CategoryTypeResponse = {
				category: Array<CategoryType>;
				login?: boolean;
			};
		}
	}
	export namespace attendance {
		export type HostelAttCalResponse = {
			absent: Array<boolean>;
			leaves: Array<boolean>;
			login?: boolean;
			monthdate: Array<string>;
			present: Array<boolean>;
			rejects: Array<boolean>;
		};
		export type HostelAttParentView = {
			btn_app: string;
			btn_rej: string;
			btn_rev: string;
			from_date: string;
			id: string;
			reason: string;
			status: string;
			type: string;
		};
		export type HostelAttParentViewResponse = {
			data: Array<HostelAttParentView>;
			login?: boolean;
		};
		export type HostelAttView = {
			btn_already_exit?: boolean;
			btn_del?: boolean;
			btn_download?: boolean;
			btn_exit?: boolean;
			date: string;
			id: string;
			reason: string;
			status: string;
			type: string;
			url: string;
		};
		export type HostelAttViewResponse = {
			data: Array<HostelAttView>;
			login?: boolean;
		};
		export type HostelScanViewResponse = {
			address: string;
			date: string;
			from_date: string;
			hostel: string;
			image: string;
			login?: boolean;
			name: string;
			phone_no: string;
			qrcode: string;
			reason: string;
			room: string;
			status: string;
			type: string;
			url: string;
		};
		export type LeaveType = {
			id?: number;
			type: string;
		};
		export type LeaveTypeResponse = {
			data: Array<LeaveType>;
			login?: boolean;
		};
	}
	export namespace asiet {
		export type AsietBoarding = {
			amount: string;
			id: string;
			name: string;
		};
		export type History = {
			id: string;
			name: string;
			reg_date: string;
			start_date: string;
			status: string;
			year: string;
		};
		export type HostelAsietRegisterViewResponse = {
			admission_no: string;
			batch: string;
			boardings: Array<AsietBoarding>;
			declaration: string;
			full_name: string;
			history: Array<History>;
			login?: boolean;
			note: string;
			route_url: string;
		};
	}
}
export namespace homework {
	export type HomeWork = {
		can_submit?: boolean;
		details: string;
		files: Array<exam.ExamFiles>;
		id: string;
		issued_date: string;
		last_date: string;
		late_submission_date: string;
		late_submission_status: string;
		semester: string;
		status: string;
		subject: string;
		teacher_feedback: string;
		title: string;
		type: string;
		uploaded_file: string;
	};
	export type HomeWorkResponse = {
		homeworks: Array<HomeWork>;
		login?: boolean;
	};
}
export namespace grievance {
	export type Grievance = {
		date: string;
		grievance_no: string;
		grievance_type: string;
		id: string;
		reminder: string;
		status: string;
		subject: string;
	};
	export type GrievanceResponse = {
		grievance: Array<Grievance>;
		login?: boolean;
	};
	export namespace view {
		export type Actions = {
			action_taken?: string;
			date?: string;
			level?: string;
		};
		export type GrievanceDoc = {
			doc?: string;
			path?: string;
		};
		export type ViewGrievance = {
			action_taken: string;
			date: string;
			description: string;
			gr_doc: Array<GrievanceDoc>;
			greivant: string;
			grievance_no: string;
			grievance_type: string;
			reply: string;
			reply_date: string;
			reply_details: string;
			reply_doc: Array<GrievanceDoc>;
			status: string;
			subject: string;
		};
		export type ViewGrievanceResponse = {
			actions: Array<Actions>;
			cellmembers: Array<string>;
			grievance: ViewGrievance;
			login?: boolean;
		};
	}
	export namespace type {
		export type GrievanceType = {
			id: string;
			name: string;
		};
		export type GrievanceTypeResponse = {
			g_types: Array<GrievanceType>;
			login?: boolean;
		};
	}
}
export namespace feepartial {
	export type InstallmentDetails = {
		balance: string;
		date: string;
		discount: string;
		editable_bal: string;
		feegroup_id: string;
		feehead: string;
		feeheadgroup_id: string;
		fees: string;
		paid: string;
		payable: string;
		scholarship: string;
	};
	export type InstallmentDetailsResponse = {
		installments: Array<InstallmentDetails>;
		login?: boolean;
		success?: boolean;
	};
	export type InstallmentList = {
		id: string;
		name: string;
	};
	export type InstallmentListResponse = {
		installments: Array<InstallmentList>;
		login?: boolean;
		success?: boolean;
	};
}
export namespace feemedical {
	export type FeesMed = {
		installment_id: string;
		installment_name: string;
		installments: Array<InstallmentsMed>;
	};
	export type FeesMedResponse = {
		fees: Array<FeesMed>;
		login?: boolean;
		success?: boolean;
	};
	export type InstallmentsMed = {
		balance: string;
		date: string;
		discount: string;
		feegroup_id: string;
		feehead: string;
		feehead_id: string;
		feeheadgroup_id: string;
		fees: string;
		paid: string;
		payable: string;
		scholarship: string;
	};
}
export namespace feeengineer {
	export namespace payment {
		export type FeeEngineer = {
			installment_id: string;
			installment_name: string;
			installments: Array<FeeEngineerInstallment>;
		};
		export type FeeEngineerInstallment = {
			balance: string;
			discount: string;
			feehead: string;
			feeheadgroup_id: string;
			fees: string;
			paid: string;
			payable: string;
			scholarship: string;
		};
		export type FeeEngineerResponse = {
			fees: Array<FeeEngineer>;
			login?: boolean;
			message: string;
			success?: boolean;
		};
		export type FeeEngineerUrlResponse = {
			error: string;
			fine: string;
			subtotal: string;
			total: string;
			url: string;
		};
	}
}
export namespace feearts {
	export namespace payment {
		export type FeeArts = {
			amount: string;
			balance?: number;
			fee_head_id: string;
			feegroup_id: string;
			feetype_id: string;
			installment_id: string;
			name: string;
			paid?: number;
			payable?: number;
			scholarship?: number;
		};
		export type FeeArtsResponse = {
			bal: string;
			date: string;
			fee_groups: Array<FeeArts>;
			fine: string;
			login?: boolean;
			student_id: string;
			success?: boolean;
			total: string;
		};
		export type FeeArtsSemester = {
			id?: number;
			name: string;
		};
		export type FeeArtsSemesterResponse = {
			installments: Array<FeeArtsSemester>;
			login?: boolean;
			success?: boolean;
		};
		export type FeeArtsUrlResponse = {
			url: string;
		};
	}
}
export namespace fee {
	export type FeeGroups = {
		amount: string;
		balance: string;
		feegroup_id: string;
		feeheadgroup_id: string;
		fee_head_id: string;
		feetype_id: string;
		name: string;
		paid: string;
		scholarship: string;
	};
	export type FeeResponse = {
		balance: string;
		date: string;
		fee_groups: Array<FeeGroups>;
		login?: boolean;
		message: string;
		paid: string;
		student_id: string;
		success?: boolean;
		total: string;
		url?: string;
	};
	export type FeeSreeChitraUrl = {
		login?: boolean;
		success?: boolean;
		url?: string;
	};
	export type FeeUrlOnlyResponse = {
		url?: string;
	};
	export type FeeUrlResponse = {
		error?: string;
		url?: string;
	};
	export type GatewayDetailsResponse = {
		address: string;
		ipg: string;
		login?: boolean;
		merchant: string;
		phone: string;
		refund: string;
	};
	export namespace receipts {
		export type Receipt = {
			amount: string;
			date: string;
			installment: string;
			method: string;
			receipt_no: string;
			refund_reason: string;
			refund_status?: boolean;
			status: string;
		};
		export type ReceiptResponse = {
			login?: boolean;
			message: string;
			receipts: Array<Receipt>;
			success?: boolean;
		};
	}
	export namespace installment {
		export type InstallmentResponse = {
			installments: Array<Installments>;
			login?: boolean;
			message: string;
			success?: boolean;
		};
		export type Installments = {
			id: string;
			name: string;
		};
	}
	export namespace feeheadgroups {
		export type FeeHeadGroup = {
			feeheadgroup_id: string;
		};
		export type FeeHeadGroupResponse = {
			fees: Array<FeeHeadGroup>;
		};
	}
}
export namespace examschedules {
	export type ExamSchedule = {
		date: string;
		details: string;
		exm_name: string;
		id: string;
		subject: string;
		time: string;
		url: string;
	};
	export type ExamScheduleResponse = {
		schedules: Array<ExamSchedule>;
	};
}
export namespace examregister {
	export type ExamCourse = {
		amount: string;
		course: string;
		feehead_id: string;
		is_eligible: string;
		is_selected?: boolean;
		no?: number;
		type: string;
	};
	export type ExamCourseResponse = {
		abc_id_verification?: boolean;
		academicyear: string;
		admission_no: string;
		batch_id: string;
		can_update?: boolean;
		category: string;
		check_box_status?: boolean;
		course: Array<ExamCourse>;
		degree: string;
		end_date: string;
		error: string;
		exam_year: string;
		fee_status?: boolean;
		fixedHeadGroup: Array<FixedHeadGroup>;
		is_registered?: boolean;
		login?: boolean;
		month: string;
		name: string;
		registration_slip?: boolean;
		semester: string;
		start_date: string;
	};
	export type ExamMessage = {
		amount: string;
		course: string;
		fineAmount: string;
		fixed_amount: string;
		is_eligible: string;
		totalAmount: string;
		type: string;
	};
	export type ExamMessageResponse = {
		error: string;
		exam: Array<ExamMessage>;
		is_registered?: boolean;
		login?: boolean;
		message: string;
		success?: boolean;
	};
	export type ExamPay = {
		amount: string;
		fineAmount: string;
		fixed_amount: string;
		totalAmount: string;
	};
	export type ExamPayResponse = {
		error: string;
		exam: Array<ExamPay>;
		is_registered?: boolean;
		login?: boolean;
		url: string;
	};
	export type ExamReceipt = {
		feeReceiptNo: string;
		print_url: string;
		receipt_date: string;
		sub_total: string;
	};
	export type ExamReceiptResponse = {
		login?: boolean;
		receipts: Array<ExamReceipt>;
	};
	export type ExamRegister = {
		id: string;
		name: string;
	};
	export type ExamRegisterResponse = {
		exam: Array<ExamRegister>;
		login?: boolean;
		notregexam: Array<ExamRegister>;
		regexam: Array<ExamRegister>;
	};
	export type ExamUpdate = {
		amount: string;
		course: string;
		feehead_id: string;
		is_eligible: string;
		is_selected?: boolean;
		msg: string;
		type: string;
	};
	export type ExamUpdateResponse = {
		admission_no: string;
		batch_id: string;
		exam: Array<ExamUpdate>;
		login?: boolean;
	};
	export type ExamView = {
		amount: string;
		course: string;
		is_eligible: string;
		type: string;
	};
	export type ExamViewResponse = {
		error: string;
		exam: Array<ExamView>;
		login?: boolean;
	};
	export type FixedHeadGroup = {
		amount: string;
		fixedHeadGrpId: string;
		head: string;
		is_eligible: string;
		no?: number;
		type: string;
	};
	export type RegistrationSlipResponse = {
		file_url: string;
		login?: boolean;
	};
	export type Revaluation = {
		course: string;
		grade: string;
		status: string;
		type: string;
	};
	export type RevaluationApply = {
		answer_script: string;
		course: string;
		date: string;
		grade: string;
		revaluation: string;
		total: string;
		type: string;
	};
	export type RevaluationApplyResponse = {
		revaluation: Array<RevaluationApply>;
	};
	export type RevaluationReceipt = {
		answer_script: string;
		course: string;
		revaluation: string;
	};
	export type RevaluationReceiptResponse = {
		receipt: Array<RevaluationReceipt>;
		sub_total: string;
		total: string;
	};
	export type RevaluationResponse = {
		revaluation: Array<Revaluation>;
	};
	export type RevaluationStatusResponse = {
		status?: boolean;
	};
	export type RevaluationUpdate = {
		answer_script: string;
		course: string;
		grade: string;
		revaluation: string;
		status: string;
		type: string;
	};
	export type RevaluationUpdateResponse = {
		revaluation: Array<RevaluationUpdate>;
	};
	export type RevaluationView = {
		answer_script: string;
		course: string;
		revaluation: string;
		revaluation_id: string;
		total: string;
		type: string;
	};
	export type RevaluationViewResponse = {
		revaluation: Array<RevaluationView>;
	};
}
export namespace exam {
	export type Exam = {
		can_download?: boolean;
		can_submit?: boolean;
		files: Array<ExamFiles>;
		finish_time: string;
		id: string;
		is_delete?: boolean;
		semester: string;
		start_time: string;
		status: string;
		subject: string;
		title: string;
		uploaded_file: string;
	};
	export type ExamFiles = {
		doc?: string;
		path?: string;
	};
	export type ModuleTestResponse = {
		error: string;
		login?: boolean;
		module_test: Array<Exam>;
	};
	export type SeriesExamResponse = {
		error: string;
		login?: boolean;
		series_exams: Array<Exam>;
	};
}
export namespace due {
	export type Due = {
		admission_no: string;
		batch: string;
		due_amount: string;
		due_head: string;
		has_due: string;
		is_paid: string;
		student_name: string;
	};
	export type DueResponse = {
		due: Array<Due>;
		login?: boolean;
	};
	export namespace duepaynew {
		export type DuePayNew = {
			admission_no: string;
			amount: string;
			balance: string;
			date: string;
			department_id: string;
			due_id: string;
			error: string;
			fullpaid?: boolean;
			head_id: string;
			paid: string;
			sem_id: string;
			status: string;
			student_id: string;
			year_id: string;
		};
		export type DuePayNewResponse = {
			collect: Array<DuePayNew>;
		};
	}
	export namespace duepay {
		export type DuePay = {
			admission_no: string;
			amount: string;
			balance: string;
			date: string;
			department_id: string;
			due_id: string;
			head_id: string;
			installment: string;
			paid: string;
			status: string;
			student_id: string;
			year_id: string;
		};
		export type DuePayResponse = {
			dues: Array<DuePay>;
			login?: boolean;
		};
		export type DuePayUrl = {
			url: string;
		};
		export type NoDueCertificateResponse = {
			login?: boolean;
			url: string;
		};
	}
}
export namespace dash {
	export type AbcResponse = {
		abc_id: string;
		instructions: string;
		login?: boolean;
		video: string;
	};
	export type DashRequest = {
		hostel?: string;
	};
	export type DashResponse = {
		attendance_forthemonth: string;
		attendance_forthesem: string;
		bank_accno: string;
		bank_branch: string;
		bank_ifsc_code: string;
		bank_name: string;
		batch_id: string;
		clg_mission: string;
		clg_vision: string;
		course: string;
		curnt_sem: string;
		current_version?: number;
		dept_mission: string;
		dept_vision: string;
		due_new: string;
		error: string;
		fee_engnr_status?: boolean;
		fee_status?: boolean;
		hostel?: number;
		hostel_status: string;
		info_msg: string;
		live_tv_link: string;
		live_tv_type: string;
		login?: boolean;
		logout_status?: boolean;
		notices: Array<NoticesDash>;
		password_changed?: boolean;
		sem_id: string;
		semreg_default?: boolean;
		student_id: string;
		survey_message: string;
		survey_status?: boolean;
		timetable: Array<Array<timetable.TimeTable>>;
		url: string;
		url_sign: string;
		usertype: string;
		version_code?: number;
		version_code_aisat?: number;
		version_code_cep?: number;
		version_code_cetkr?: number;
		version_code_cev?: number;
		version_code_coet?: number;
		version_code_engnr?: number;
		version_code_gcei?: number;
		version_code_gcek?: number;
		version_code_gcekkd?: number;
		version_code_gecskp?: number;
		version_code_gectcr?: number;
		version_code_gecwyd?: number;
		version_code_jecc?: number;
		version_code_kmea?: number;
		version_code_kmeacoa?: number;
		version_code_mace?: number;
		version_code_marian?: number;
		version_code_mdit?: number;
		version_code_nssce?: number;
		version_code_sctce?: number;
		version_code_sjcetpalai?: number;
		version_code_tkmce?: number;
	};
	export type LibraryResponse = {
		login?: boolean;
		url: string;
	};
	export type MaintenanceResponse = {
		message: string;
		success?: boolean;
	};
	export type NoticesDash = {
		content: string;
	};
	export type PendingSurvey = {
		coursesurvey_status?: boolean;
		error: string;
		posurvey_status?: boolean;
		profile_status?: boolean;
		semreg_default?: boolean;
		survey_status?: boolean;
	};
	export type ProfileResponse = {
		address1: string;
		address2: string;
		address3: string;
		adharno: string;
		admission_no: string;
		bank_accno: string;
		bank_branch: string;
		bank_edit?: boolean;
		bank_ifsc_code: string;
		bank_name: string;
		bankdetail_status: string;
		blood_group: string;
		district: string;
		dob: string;
		edit_profile?: boolean;
		email: string;
		father_name: string;
		father_occupation: string;
		gender: string;
		mother_name: string;
		mother_occupation: string;
		name: string;
		nationality: string;
		phone_father: string;
		phone_home: string;
		phone_mother: string;
		pin: string;
		profile_edit_live?: boolean;
		register_no: string;
		religion: string;
		state: string;
	};
	export namespace daywisetimetaable {
		export type DayWise = {
			day: string;
			sub: Array<DayWiseTopicName>;
		};
		export type DayWiseResponse = {
			login?: boolean;
			timetable: Array<DayWise>;
		};
		export type DayWiseTopicName = {
			hour?: number;
			staff: string;
			subject: string;
			topic_name: Array<string>;
			type: string;
		};
	}
}
export namespace counselling {
	export type Counselling = {
		counselling_no: string;
		counselling_type: string;
		date: string;
		id: string;
		reminder: string;
		status: string;
	};
	export type CounsellingResponse = {
		login?: boolean;
		requests: Array<Counselling>;
	};
	export namespace view {
		export type Actions2 = {
			action_taken?: string;
			date?: string;
			level?: string;
		};
		export type ViewCounselling = {
			applicant: string;
			concern: string;
			counselling_history: string;
			counselling_session_required: string;
			counselling_type: string;
			date: string;
			id: string;
			impact_home: string;
			impact_physically_emotionally: string;
			impact_relationship: string;
			impact_studies: string;
		};
		export type ViewCounsellingResponse = {
			actions: Array<Actions2>;
			cell_members: Array<string>;
			login?: boolean;
			requests: ViewCounselling;
		};
	}
	export namespace type {
		export type CounsellingTypes = {
			id: string;
			name: string;
		};
		export type CounsellingTypesResponse = {
			c_types: Array<CounsellingTypes>;
			login?: boolean;
		};
	}
	export namespace status {
		export type CounsellingStatus = {
			id: string;
			name: string;
		};
		export type CounsellingStatusResponse = {
			data: Array<CounsellingStatus>;
			login?: boolean;
		};
	}
}
export namespace common {
	export type Circular = {
		date: string;
		description: string;
		heading: string;
		link: string;
		url: string;
	};
	export type Remarks = {
		remark: string;
		teacher: string;
	};
	export type Teacher = {
		image_url: string;
		t_email: string;
		t_phone: string;
		t_subject: string;
		t_name: string;
	};
	export type TeacherResponse = {
		hod: Array<Teacher>;
		staffadvisor: Array<Teacher>;
		sub_teacher: Array<Teacher>;
	};
}
export namespace chat {
	export namespace subjects {
		export type Chat = {
			batch_id: string;
			sem: string;
			subject: string;
			subject_id: string;
		};
		export type ChatResponse = {
			error: string;
			login?: boolean;
			subjects: Array<Chat>;
		};
	}
	export namespace reply {
		export type Reply = {
			img: string;
			name: string;
			reply: string;
			time: string;
		};
		export type ReplyResponse = {
			error: string;
			login?: boolean;
			reply: Array<Reply>;
		};
	}
	export namespace comment {
		export type Comment = {
			comment: string;
			comment_id: string;
			cmnt_user: string;
			img: string;
			reply: Array<chat.reply.Reply>;
			time: string;
		};
		export type CommentResponse = {
			comments: Array<Comment>;
			error: string;
			login?: boolean;
		};
	}
}
export namespace certificaterequest {
	export type CertificateRequest = {
		certificate_type: string;
		date_of_application: string;
		status: string;
	};
	export type CertificateRequestResponse = {
		history: Array<CertificateRequest>;
		error: string;
		login?: boolean;
	};
	export type CertificateType = {
		id: string;
		type: string;
	};
	export type CertificateType2 = {
		name: string;
	};
	export type CertificateTypeResponse = {
		certificate_type: Array<CertificateType>;
		class_selected: Array<CertificateType2>;
		error: string;
		login?: boolean;
		request_for: Array<CertificateType2>;
		request_opted: Array<CertificateType2>;
	};
}
export namespace centralizedinfo {
	export type CentralizedInfo = {
		date: string;
		link: string;
		title: string;
		type: string;
	};
	export type CentralizedInfoResponse = {
		info: Array<CentralizedInfo>;
		login?: boolean;
	};
}
export namespace calendar {
	export type Calendar = {
		date: string;
		subject: string;
	};
	export type CalendarResponse = {
		data: Array<Calendar>;
		error: string;
		login?: boolean;
	};
}
export namespace attendance {
	export type Attendance = {
		class_attended: string;
		credit_percent: string;
		credit_total: string;
		percentage: string;
		percentage_dutyleave: string;
		percentage_subject: string;
		subject: string;
		total_classes: string;
		total_dutyleave: string;
		total_subject: string;
	};
	export type AttendanceDay = {
		attendance: string;
		coverage: Array<string>;
		hour: string;
		subject: string;
	};
	export type AttendanceDayRequest = {
		date: string;
		semester: string;
	};
	export type AttendanceDayResponse = {
		attends: Array<AttendanceDay>;
	};
	export type AttendanceNew = {
		date: string;
		holiday?: boolean;
		periods: Array<AttendancePeriod>;
		totalperiod?: number;
	};
	export type AttendanceNewResponse = {
		attends: Array<AttendanceNew>;
	};
	export type AttendancePeriod = {
		attendance: string;
		hour?: number;
		subject: string;
	};
	export type AttendanceRequest = {
		sem_id: string;
	};
	export type AttendanceRequestNew = {
		month: string;
		semester: string;
		year: string;
	};
	export type AttendanceResponse = {
		error: string;
		login?: boolean;
		subjects: Array<Attendance>;
		total_credit: string;
		total_percent: string;
	};
}
export namespace assignment {
	export type Assignment = {
		can_download?: boolean;
		can_submit?: boolean;
		details: string;
		id: string;
		issue_date: string;
		last_date: string;
		semester: string;
		status: string;
		subject: string;
		title: string;
		upload?: boolean;
		uploaded_file: string;
		url: string;
	};
	export type AssignmentRequest = {
		filter: string;
		sem_id: string;
		sort: string;
	};
	export type AssignmentResponse = {
		assignments: Array<Assignment>;
		error: string;
		login?: boolean;
	};
}
export namespace activitypoint {
	export type ActivityPointResponse = {
		activity_points?: Array<ActivityPoints>;
		error?: string;
		login?: boolean;
		total_activity_point?: string;
	};
	export type ActivityPoints = {
		activity_name: string;
		point: string;
		semester: string;
	};
	export namespace manage {
		export type ActivityBatch = {
			activity_batch_id: string;
			activity_name: string;
			description: string;
			max_point: string;
			semester: string;
			status: string;
		};
		export type ActivityBatchResponse = {
			activity_batch?: Array<ActivityBatch>;
			error?: string;
			login?: boolean;
		};
	}
}
