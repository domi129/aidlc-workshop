"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MenuService = void 0;
const aws_sdk_1 = require("aws-sdk");
const uuid_1 = require("uuid");
const dynamodb = new aws_sdk_1.DynamoDB.DocumentClient();
const s3 = new aws_sdk_1.S3();
const MENUS_TABLE = process.env.MENUS_TABLE || 'Menus';
const S3_BUCKET = process.env.S3_BUCKET || 'table-order-menu-images';
class MenuService {
    async getMenusByStore(storeId) {
        const params = {
            TableName: MENUS_TABLE,
            IndexName: 'storeId-index',
            KeyConditionExpression: 'storeId = :storeId',
            ExpressionAttributeValues: {
                ':storeId': storeId
            }
        };
        const result = await dynamodb.query(params).promise();
        return (result.Items || []);
    }
    async createMenu(input) {
        const menu = {
            menuId: (0, uuid_1.v4)(),
            storeId: input.storeId,
            menuName: input.menuName,
            price: input.price,
            description: input.description,
            category: input.category,
            imageUrl: input.imageUrl,
            isAvailable: true,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        await dynamodb.put({
            TableName: MENUS_TABLE,
            Item: menu
        }).promise();
        return menu;
    }
    async updateMenu(menuId, input) {
        const updateExpressions = [];
        const expressionAttributeNames = {};
        const expressionAttributeValues = {};
        if (input.menuName !== undefined) {
            updateExpressions.push('#menuName = :menuName');
            expressionAttributeNames['#menuName'] = 'menuName';
            expressionAttributeValues[':menuName'] = input.menuName;
        }
        if (input.price !== undefined) {
            updateExpressions.push('#price = :price');
            expressionAttributeNames['#price'] = 'price';
            expressionAttributeValues[':price'] = input.price;
        }
        if (input.description !== undefined) {
            updateExpressions.push('#description = :description');
            expressionAttributeNames['#description'] = 'description';
            expressionAttributeValues[':description'] = input.description;
        }
        if (input.category !== undefined) {
            updateExpressions.push('#category = :category');
            expressionAttributeNames['#category'] = 'category';
            expressionAttributeValues[':category'] = input.category;
        }
        if (input.imageUrl !== undefined) {
            updateExpressions.push('#imageUrl = :imageUrl');
            expressionAttributeNames['#imageUrl'] = 'imageUrl';
            expressionAttributeValues[':imageUrl'] = input.imageUrl;
        }
        if (input.isAvailable !== undefined) {
            updateExpressions.push('#isAvailable = :isAvailable');
            expressionAttributeNames['#isAvailable'] = 'isAvailable';
            expressionAttributeValues[':isAvailable'] = input.isAvailable;
        }
        updateExpressions.push('#updatedAt = :updatedAt');
        expressionAttributeNames['#updatedAt'] = 'updatedAt';
        expressionAttributeValues[':updatedAt'] = Date.now();
        const params = {
            TableName: MENUS_TABLE,
            Key: { menuId },
            UpdateExpression: `SET ${updateExpressions.join(', ')}`,
            ExpressionAttributeNames: expressionAttributeNames,
            ExpressionAttributeValues: expressionAttributeValues,
            ReturnValues: 'ALL_NEW'
        };
        const result = await dynamodb.update(params).promise();
        return result.Attributes;
    }
    async deleteMenu(menuId) {
        await dynamodb.delete({
            TableName: MENUS_TABLE,
            Key: { menuId }
        }).promise();
    }
    async generateUploadUrl(storeId, fileName) {
        const key = `menus/${storeId}/${(0, uuid_1.v4)()}-${fileName}`;
        const uploadUrl = s3.getSignedUrl('putObject', {
            Bucket: S3_BUCKET,
            Key: key,
            Expires: 300, // 5 minutes
            ContentType: 'image/jpeg'
        });
        const imageUrl = `https://${S3_BUCKET}.s3.amazonaws.com/${key}`;
        return { uploadUrl, imageUrl };
    }
}
exports.MenuService = MenuService;
