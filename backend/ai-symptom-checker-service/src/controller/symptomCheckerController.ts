import { Response } from "express";
import { answerFollowUpQuestionsService, checkSymptomsService, getUserHistoryService } from "../service/symptomCheckerService";
import { catchAsync } from "../utils/catchAsync";
import { XResponse } from "../types/XResponse";
import httpStatus from "http-status";
import { XRequest } from "../types/XRequest";

export const checkSymptomsController = catchAsync(async (req: XRequest, res: Response) => {
    const data = {
        rawInput: req.body.rawInput,
        additionalContext: req.body.additionalContext,
        patientId: req.user.id
    }

    const result = await checkSymptomsService(data);

    const response: XResponse = {
        message: 'Symptoms Checked Successfully',
        data: result,
    };
    res.status(httpStatus.OK).send(response);
});

export const answerFollowUpQuestionsController = catchAsync(async (req: XRequest, res: Response) => {
    const data = {
        checkId: req.params.checkId as string,
        patientId: req.user.id,
        followUpAnswers: req.body.followUpAnswers,
    }
    const check = await answerFollowUpQuestionsService(data);
    const response: XResponse = {
        message: 'Symptoms Checked Successfully',
        data: check,
    };
    return res.status(httpStatus.OK).json(response);
});

export const getUserHistoryController = catchAsync(async (req: XRequest, res: Response) => {
    const history = await getUserHistoryService(req.user.id);
    const response: XResponse = {
        message: 'History Fetched Successfully',
        data: history,
    };
    res.status(httpStatus.OK).send(response);
});