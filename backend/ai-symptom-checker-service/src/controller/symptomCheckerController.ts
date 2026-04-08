import { Request, Response } from "express";
import { checkSymptomsService } from "../service/symptomCheckerService";
import { catchAsync } from "../utils/catchAsync";
import { XResponse } from "../types/XResponse";
import httpStatus from "http-status";

export const checkSymptomsController = catchAsync(async (req: Request, res: Response) => {
    const result = await checkSymptomsService(req.body);

    const response: XResponse = {
        message: 'Symptoms Checked Successfully',
        data: result,
    };
    res.status(httpStatus.OK).send(response);
});