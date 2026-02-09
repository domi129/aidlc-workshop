import { DynamoDB, S3 } from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

const dynamodb = new DynamoDB.DocumentClient();
const s3 = new S3();

const MENUS_TABLE = process.env.MENUS_TABLE || 'Menus';
const S3_BUCKET = process.env.S3_BUCKET || 'table-order-menu-images';

export interface Menu {
  menuId: string;
  storeId: string;
  menuName: string;
  price: number;
  description?: string;
  category: string;
  imageUrl?: string;
  isAvailable: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface CreateMenuInput {
  storeId: string;
  menuName: string;
  price: number;
  description?: string;
  category: string;
  imageUrl?: string;
}

export interface UpdateMenuInput {
  menuName?: string;
  price?: number;
  description?: string;
  category?: string;
  imageUrl?: string;
  isAvailable?: boolean;
}

export class MenuService {
  async getMenusByStore(storeId: string): Promise<Menu[]> {
    const params = {
      TableName: MENUS_TABLE,
      IndexName: 'storeId-index',
      KeyConditionExpression: 'storeId = :storeId',
      ExpressionAttributeValues: {
        ':storeId': storeId
      }
    };

    const result = await dynamodb.query(params).promise();
    return (result.Items || []) as Menu[];
  }

  async createMenu(input: CreateMenuInput): Promise<Menu> {
    const menu: Menu = {
      menuId: uuidv4(),
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

  async updateMenu(menuId: string, input: UpdateMenuInput): Promise<Menu> {
    const updateExpressions: string[] = [];
    const expressionAttributeNames: any = {};
    const expressionAttributeValues: any = {};

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
    return result.Attributes as Menu;
  }

  async deleteMenu(menuId: string): Promise<void> {
    await dynamodb.delete({
      TableName: MENUS_TABLE,
      Key: { menuId }
    }).promise();
  }

  async generateUploadUrl(storeId: string, fileName: string): Promise<{ uploadUrl: string; imageUrl: string }> {
    const key = `menus/${storeId}/${uuidv4()}-${fileName}`;
    
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
