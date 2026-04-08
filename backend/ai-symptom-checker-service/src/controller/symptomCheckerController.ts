import { Request, Response } from "express";
import { answerFollowUpQuestionsService, checkSymptomsService } from "../service/symptomCheckerService";
import { catchAsync } from "../utils/catchAsync";
import { XResponse } from "../types/XResponse";
import httpStatus from "http-status";
import { XRequest } from "../types/XRequest";

export const checkSymptomsController = catchAsync(async (req: Request, res: Response) => {

    const result = await checkSymptomsService(req.body);

    const response: XResponse = {
        message: 'Symptoms Checked Successfully',
        data: result,
    };
    res.status(httpStatus.OK).send(response);
});

export const answerFollowUpQuestionsController = catchAsync(async (req: XRequest, res: Response) => {
    const checkId = req.params.checkId as string;
    const { followUpAnswers } = req.body;
    const check = await answerFollowUpQuestionsService({
        checkId, patientId: req.user.id, followUpAnswers,
    });
    const response: XResponse = {
        message: 'Symptoms Checked Successfully',
        data: check,
    };
    return res.status(httpStatus.OK).json(response);
})