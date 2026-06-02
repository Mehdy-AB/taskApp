import { UnauthorizedException, Logger, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { isNumber } from 'class-validator';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../../prisma.service';
import * as fs from 'fs';
import * as path from 'path'
import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';

@WebSocketGateway()
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private sockets = new Map<string, number>();
  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private jwt: JwtService,
    private prisma: PrismaService,
  ) {}

  private async getOAuth2Client() {
      const oAuth2Client = new OAuth2Client(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        'https://developers.google.com/oauthplayground',
      );
  
      oAuth2Client.setCredentials({
        refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
      });
  
      return oAuth2Client;
  }
  
  private loadTemplate(filename: string): string {
    const filePath = path.join(process.cwd(), 'src', 'templates', filename);
    return fs.readFileSync(filePath, { encoding: 'utf-8' });
  }
   /**
   * Méthode générique pour envoyer un email “raw” encodé en base64url.
   * @param to Email du destinataire
   * @param subject Sujet de l’email
   * @param htmlBody Contenu HTML complet du corps de l’email
   */
  private async sendRawEmail(to: string, subject: string, htmlBody: string) {
    const oAuth2Client = await this.getOAuth2Client();
    const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
    const encodedSubject = `=?UTF-8?B?${Buffer.from(subject).toString('base64')}?=`;
    // Construction de l’enveloppe MIME avec en-têtes + corps HTML
    const mimeLines = [
      `From: "Votre App" <${process.env.GMAIL_SENDER}>`,
      `To: ${to}`,
      `Subject: ${encodedSubject}`,
      `MIME-Version: 1.0`,
      `Content-Type: text/html; charset="UTF-8"`,
      `Content-Transfer-Encoding: 7bit`,
      ``,
      htmlBody,
    ];
    const mimeMessage = mimeLines.join('\r\n');

    // Encodage base64url (= Base64 + remplacements + suppression des '=' finaux)
    const encodedMessage = Buffer.from(mimeMessage)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    try {
      await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedMessage,
        },
      });
    } catch (error) {
      console.error('Erreur lors de l’envoi d’email :', error);
      throw new ConflictException('Une erreur est survenue lors de l’envoi de l’email');
    }
  }
  /**
   * 2) Notification : un utilisateur A a envoyé un message à l’utilisateur B.
   * @param recipientEmail Adresse email de l’utilisateur B (qui reçoit le message)
   * @param senderName Nom de l’utilisateur A (expéditeur)
   * @param messageContenu Contenu du message envoyé
   */
  public async sendUserMessageNotification(
    recipientEmail: string,
    senderName: string,
    messageContenu: string,
  ) {
    let htmlTemplate = this.loadTemplate('notify-user-message.html');
    htmlTemplate = htmlTemplate
      .replace(/{{SENDER_NAME}}/g, senderName)
      .replace(/{{MESSAGE_CONTENT}}/g, messageContenu);

    const subject = `Vous avez reçu un message de ${senderName}`;
    await this.sendRawEmail(recipientEmail, subject, htmlTemplate);
  }
  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token;
      if (!token) {
        client.disconnect();
        throw new UnauthorizedException('Token missing');
      }

      const payload = await this.jwt.verifyAsync(token, {
        secret: process.env.JWT_SECRET_ACCESS,
      });

      const userId = payload.id;
      if (!userId) {
        client.disconnect();
        throw new UnauthorizedException('Invalid token payload');
      }

      const { password, passwordVersion, bio, ...user } =
        await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        client.disconnect();
        throw new UnauthorizedException('User not found');
      }

      await this.prisma.user.update({
        where: { id: user.id },
        data: { isOnline: true,activeAt: new Date() },
      });
      this.sockets.set(client.id, user.id);
      client.emit('ready', { userId });
      this.broadcastUsers();
    } catch (err) {
      this.logger.warn(`Connection denied: ${err.message}`);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    try {
      const userId = this.sockets.get(client.id);
      if (userId) {
        await this.prisma.user.update({
          where: { id: userId },
          data: { isOnline: false ,activeAt: new Date()},
          
        });
        this.sockets.delete(client.id);
        this.broadcastUsers();
      }
    } catch (err) {
      this.logger.error(`Error during disconnect: ${err.message}`);
    }
  }

  private async broadcastUsers() {
    try {
      const users = await this.prisma.user.findMany({
        select: { username: true, isOnline: true },
      });
      this.server.emit('users', users);
    } catch (err) {
      this.logger.error(`Error broadcasting users: ${err.message}`);
    }
  }

  afterInit(server: Server) {
    server.on('connection', (client: Socket) => {
      client.on('sendMessage', async (payload, callback) => {
        try {
          const senderId = this.sockets.get(client.id);
          if (!senderId || !payload.conversationId || !payload.content) return;

          const existingConversation = await this.prisma.conversation.findFirst({
            where: {
              id: payload.conversationId,
              OR: [{ receiverId: senderId }, { senderId: senderId }],
            },select: {activeAt: true,},});
          if(!existingConversation)throw new Error()
          const conversation = await this.prisma.conversation.update({
            where: {
              id: payload.conversationId,
              OR: [{ receiverId: senderId }, { senderId: senderId }],
            }, 
            data: { activeAt: new Date() },
            select: { id: true, senderId: true,receiver:{select:{username:true,email:true}},sender:{select:{username:true,email:true}}, receiverId: true,activeAt:true },
          });

          if (!conversation) throw new Error();

          const message = await this.prisma.message.create({
            data: {
              content: payload.content,
              sender: { connect: { id: senderId } },
              conversation: { connect: { id: conversation.id } },
            },
          });
          await this.prisma.conversation.update({
            where: { id: conversation.id },
            data: { activeAt: new Date() },
          });

          const receiverId =
             conversation.senderId === senderId
              ? conversation.receiverId
              : conversation.senderId;

          for (const [sockId, id] of this.sockets.entries()) {
            if (id === receiverId) {
              this.server.to(sockId).emit('receiveMessage', message);
            }
          }
          if ( (Date.now() - new Date(existingConversation.activeAt).getTime() > 24 * 60 * 60 * 1000)) {
            await this.sendUserMessageNotification(
              conversation.senderId === senderId? conversation.receiver.email:conversation.sender.email,
              conversation.sender.username,
              message.content
            );
          }
          client.emit('receiveMessage', message);

          // ✅ THIS IS THE FIX: call the acknowledgement callback!
          if (callback && typeof callback === 'function') {
            callback(message);
          }
        } catch (err) {
          console.error('sendMessage error:', err.message);
        }
      });
    });
  }


  @SubscribeMessage('getMessages')
  async handleGetMessages(
    client: Socket,
    payload: { conversationId: number; skip?: number; limit?: number },
  ) {
    try {
      const senderId = this.sockets.get(client.id);
      if (!senderId || !payload.conversationId) return;

      const conversation = await this.prisma.conversation.findUnique({
        where: {
          id: payload.conversationId,
          OR: [{ receiverId: senderId }, { senderId: senderId }],
        },
        select: { id: true, receiverId: true, senderId: true },
      });

      if (!conversation) return;

      const take = payload.limit || 20;
      const skip = payload.skip || 0;

      const [messages, totalCount] = await Promise.all([
        this.prisma.message.findMany({
          where: {
            conversationId: conversation.id,
          },
          include: { conversation: true },
          orderBy: { sentAt: 'asc' },
          take,
          skip,
        }),
        this.prisma.message.count({
          where: {
            conversationId: conversation.id,
          },
        }),
      ]);

      client.emit('messages', {
        messages,
        nextPage: skip + 10,
      });
    } catch (err) {
      this.logger.error(`Error getting messages: ${err.message}`);
    }
  }

  @SubscribeMessage('markAsSeen')
  async handleMarkAsSeen(client: Socket, body: { conversationId: number }) {
    try {
      const receiverId = this.sockets.get(client.id);
      if (!receiverId || !body.conversationId) return;

      const conversation = await this.prisma.conversation.findUnique({
        where: {
          id: body.conversationId,
          OR: [{ receiverId: receiverId }, { senderId: receiverId }],
        },
        select: { id: true, receiverId: true, senderId: true },
      });
      if (!conversation) return;
      const senderId =
        receiverId === conversation.receiverId
          ? conversation.senderId
          : conversation.receiverId;
      await this.prisma.message.updateMany({
        where: {
          conversationId: conversation.id,
          senderId: senderId,
          read: false,
        },
        data: { read: true },
      });

      for (const [sockId, id] of this.sockets.entries()) {
        if (id === senderId) {
          this.server.to(sockId).emit('messagesSeen', {
            conversationId: body.conversationId,
            by: receiverId,
          });
        }else if(id === receiverId) {
          this.server.to(sockId).emit('messagesISeenIt', {
            conversationId: body.conversationId,
            by: receiverId,
          });
        }
      }
    } catch (err) {
      this.logger.error(`Error marking messages as seen: ${err.message}`);
    }
  }

  @SubscribeMessage('getContacts')
  async handleGetContacts(
    client: Socket,
    payload: { skip?: number; limit?: number },
  ) {
    const sendedrId = this.sockets.get(client.id);

    try {
      const userId = this.sockets.get(client.id);
      if (!userId || !isNumber(userId)) return;

      const skip = payload?.skip || 0;
      const take = payload?.limit || 40;

      const contactUsers = await this.prisma.conversation.findMany({
        where: { OR: [{ senderId: userId }, { receiverId: userId }] },
        select: {
          id: true,
          activeAt: true,
          sender: {
            select: {
              id: true,
              activeAt: true,
              image: { select: { url: true } },
              fullName: true,
              phone: true,
              username: true,
              email: true,
              isOnline: true,
            },
          },
          receiver: {
            select: {
              id: true,
              activeAt: true,
              image: { select: { url: true } },
              fullName: true,
              phone: true,
              username: true,
              email: true,
              isOnline: true,
            },
          },
          ad: {
            select: {
              id: true,
              title: true,
              price: true,
              media: {
                select: {
                  media: {
                    select: { url: true },
                  },
                },
              },
            },
          },
        },
        skip,
        take,
      });

      const conversation = contactUsers.map((conversation) => {
        return conversation.sender.id === userId
          ? {
              id: conversation.id,
              user: conversation.receiver,
              ad: conversation.ad,
              time: conversation.activeAt,
            }
          : {
              id: conversation.id,
              user: conversation.sender,
              ad: conversation.ad,
              time: conversation.activeAt,
            };
      });

      const totalUsers = await this.prisma.conversation.count({
        where: { OR: [{ senderId: userId }, { receiverId: userId }] },
      });

      client.emit('contacts', {
        conversation: conversation,
        hasMore: skip + take < totalUsers,
      });
    } catch (err) {
      this.logger.error(`Error getting contacts: ${err.message}`);
    }
  }
}