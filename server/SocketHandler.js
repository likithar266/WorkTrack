import { Chat, Project } from "./Schema.js";
import { v4 as uuidv4 } from 'uuid';

const SocketHandler = (socket) =>{

    socket.on("join-chat-room", ({projectId, freelancerId})=>{
        try {
            const project = Project.findById(projectId);

            if(project && project.freelancerId === freelancerId){
                socket.join(projectId);
                console.log(socket.rooms);
                
                socket.broadcast.to(projectId).emit("user-joined-room");
                
                let chats = Chat.findById(projectId);
                
                if(!chats){
                    chats = Chat.create({
                        _id: projectId,
                        messages: []
                    });
                }
                
                socket.emit('messages-updated', {chats});
            }
        } catch (error) {
            console.error('Error in join-chat-room:', error);
        }
    })

    socket.on("join-chat-room-client", ({projectId})=>{
        try {
            const project = Project.findById(projectId);

            if(project && (project.status === "Assigned" || project.status === "Completed")){
                socket.join(projectId);
                console.log(socket.rooms);
                
                socket.broadcast.to(projectId).emit("user-joined-room");
                
                let chats = Chat.findById(projectId);
                
                if(!chats){
                    chats = Chat.create({
                        _id: projectId,
                        messages: []
                    });
                }
                
                socket.emit('messages-updated', {chats});
            }
        } catch (error) {
            console.error('Error in join-chat-room-client:', error);
        }
    })

    socket.on('update-messages', ({ projectId }) => {
        try {
            const chat = Chat.findById(projectId);
            console.log('updating messages');
            socket.emit('messages-updated', { chat });
        } catch (error) {
            console.error('Error updating messages:', error);
        }
    });

    socket.on('new-message', ({ projectId, senderId, message, time}) => {
        try {
            const messageObj = { 
                id: uuidv4(), 
                text: message, 
                senderId, 
                time 
            };
            
            Chat.addMessage(projectId, messageObj);
            
            const chat = Chat.findById(projectId);
            console.log(chat);
            socket.emit('messages-updated', { chat });
            socket.broadcast.to(projectId).emit('message-from-user');
        } catch (error) {
            console.error('Error adding new message:', error);
        }
    });
}

export default SocketHandler;
