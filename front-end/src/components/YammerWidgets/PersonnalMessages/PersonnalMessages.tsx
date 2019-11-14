import React, { useEffect, useState } from "react";
import axios from "axios";
import { Tag, List, Menu, Card, Badge, Dropdown, Icon } from "antd";
import styled from "styled-components";
import { dragHelper } from '../../drag-help';

const {SubMenu} = Menu;
const Container = styled.div`
	width: 100%;
	height: 100%;
`;

let intervalId: any;

const PersonnalMessagesWrapper: React.FC = (props: any) => {
	const [messages, setMessages] = useState([]);
	const [loading, setLoading] = useState(false);
	const [limit, setLimit] = useState(20);
	const [timer, setTimer] = useState(5);
	const [ users, setUsers ] = useState([]);
	const [ selectedUser, setSelectedUser ] = useState('');

	useEffect(() => {
		dragHelper();
		getMessages();
		clearInterval(intervalId);
		intervalId = setInterval(() => {
			getMessages();
		}, timer * 60 * 1000);
	}, [timer]);

	const yammer = props.services.find(
		(item: any) => item.serviceName === "yammer"
	);

	const headers = {
		headers: {
			Authorization: `Bearer ${yammer.serviceToken}`
		}
	};

	const handleTimer = (ev: any) => {
		if (intervalId) {
			clearInterval(intervalId);
		}
		setTimer(ev.key);
	};

	const timerMenu = (
		<Menu onClick={handleTimer}>
			<Menu.Item key={5}>5</Menu.Item>
			<Menu.Item key={10}>10</Menu.Item>
			<Menu.Item key={15}>15</Menu.Item>
		</Menu>
	);

	const getMessages = async () => {
		setLoading(true);
		let tmpUsers: any = [];
		const res = await axios.get(
			"https://api.yammer.com/api/v1/messages/received.json?threaded=true",
			headers
		);
		if (res.data.messages.length > 19) {
			const next = await axios.get(
				`https://api.yammer.com/api/v1/messages/receive.json?threaded=true?older_than=${res.data.messages[19].id}`,
				headers
			);
			res.data.messages = res.data.messages.concat(next.data.messages);
		}
		Promise.all(
			res.data.messages.map(async (message: any) => {
				const res = await getUsers(message.sender_id);
				message.username = res.data.full_name;
				tmpUsers.push(res.data.full_name);
				return message;
			})
		).then((results: any) => {
			let uniq: any = [ ...new Set(tmpUsers) ];
			setMessages(results);
			setUsers(uniq);
			setLoading(false);
		});
	};

	const getUsers = (userId: any) => {
		return axios.get(
			`https://api.yammer.com/api/v1/users/${userId}.json`,
			headers
		);
	};

	const onMenuClick = (ev: any) => {
		setLimit(ev.keyPath[1]);
		setSelectedUser(ev.keyPath[0]);
	};

	const menu = (
		<Menu onClick={onMenuClick}>
			<SubMenu title="5" key={5}>
				{users.map((user: any, key) => <Menu.Item key={user}>{user}</Menu.Item>)}
			</SubMenu>
			<SubMenu title="10" key={10}>
				{users.map((user: any, key) => <Menu.Item key={user}>{user}</Menu.Item>)}
			</SubMenu>
			<SubMenu title="15" key={15}>
				{users.map((user: any, key) => <Menu.Item key={user}>{user}</Menu.Item>)}
			</SubMenu>
			<SubMenu title="20" key={20}>
				{users.map((user: any, key) => <Menu.Item key={user}>{user}</Menu.Item>)}
			</SubMenu>
		</Menu>
	);

	return (
		<Container>
			<Card
				loading={loading}
				style={{ height: "100%", overflow: "auto" }}
				title={
					<Dropdown overlay={menu}>
						<a className="ant-dropdown-link" href="#">
							Last {limit} personnal messages <Icon type="down" />
						</a>
					</Dropdown>
				}
				extra={
					<Dropdown overlay={timerMenu}>
						<a className="ant-dropdown-link" href="#">
							Refresh {timer} min
							<Icon type="down" />
						</a>
					</Dropdown>
				}
			>
				<List
					dataSource={messages.filter((message: any) => message.username === selectedUser).slice(0, limit)}
					renderItem={(item: any, key) => (
						<List.Item>
							<div>
								<Tag
									color="green"
									style={{ cursor: "pointer" }}
									onClick={() => window.open(item.web_url, "_blank")}
								>
									{item.username} <Icon type="link" />
								</Tag>
								<Tag color="purple">
									{item.liked_by.count} <Icon type="like" />
								</Tag>
								<br />

								<Badge
									status={item.body.plain ? "processing" : "error"}
									key={key}
									text={item.body.plain ? item.body.plain : "No content"}
								/>
							</div>
						</List.Item>
					)}
				/>
			</Card>
		</Container>
	);
};

export { PersonnalMessagesWrapper };
