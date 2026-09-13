import * as THREE from 'three';
import { CAT_CLIPS } from './cat-media';
import { webSprites } from './web-sprites';

export function createWebpageBackdrop(era: number) {
	const canvas = document.createElement('canvas');
	canvas.width = 640;
	canvas.height = 400;
	const c = canvas.getContext('2d')!;
	c.imageSmoothingEnabled = false;
	const pictures: HTMLImageElement[] = [];
	let disposed = false;
	const image = (url: string) => {
		const im = new Image();
		im.onload = () => {
			if (!disposed) paint();
		};
		im.src = url;
		pictures.push(im);
		return im;
	};
	const catPictures = CAT_CLIPS.map((clip) => image(clip.thumbnail));
	let pictureIndex = 0;
	const cat = catPictures[0],
		globe = image(webSprites.globe.url),
		stars = image(webSprites.star.url),
		hello = image(webSprites.hello.url),
		email = image(webSprites.email.url);
	const sprites = new Map<
		HTMLImageElement,
		{ durations: readonly number[]; tile: number; columns: number }
	>([
		[globe, webSprites.globe],
		[stars, webSprites.star],
		[hello, webSprites.hello],
		[email, webSprites.email]
	]);
	let clock = 0,
		still = true,
		lastFrame = -1;
	const tex = new THREE.CanvasTexture(canvas);
	tex.colorSpace = THREE.SRGBColorSpace;
	tex.magFilter = THREE.NearestFilter;
	tex.minFilter = THREE.NearestFilter;
	const rect = (x: number, y: number, w: number, h: number, color: string) => {
		c.fillStyle = color;
		c.fillRect(x, y, w, h);
	};
	const text = (s: string, x: number, y: number, color: string, size = 10) => {
		c.font = `${size}px monospace`;
		c.fillStyle = color;
		c.fillText(s, x, y);
	};
	const line = (x: number, y: number, w: number, color: string) => rect(x, y, w, 1, color);
	const img = (im: HTMLImageElement, x: number, y: number, w: number, h: number) => {
		if (im === cat) im = catPictures[(era + pictureIndex++) % catPictures.length];
		if (!im.complete || !im.naturalWidth) return;
		const sprite = sprites.get(im);
		if (!sprite) {
			c.drawImage(im, x, y, w, h);
			return;
		}
		let frame = 0,
			t = still ? 0 : clock % sprite.durations.reduce((a, b) => a + b, 0);
		while (frame < sprite.durations.length - 1 && t >= sprite.durations[frame]) {
			t -= sprite.durations[frame];
			frame++;
		}
		c.drawImage(
			im,
			(frame % sprite.columns) * sprite.tile,
			Math.floor(frame / sprite.columns) * sprite.tile,
			sprite.tile,
			sprite.tile,
			x,
			y,
			w,
			h
		);
	};
	function paint() {
		pictureIndex = 0;
		if (innerWidth < 760) {
			const backgrounds = [
				'#233e37',
				'#cac8c0',
				'#343255',
				'#b5c6d5',
				'#f3efdf',
				'#7cb4d5',
				'#d2b780',
				'#eee7da',
				'#eeeade',
				'#c6c8c3',
				'#9eafb9',
				'#e9e3d8',
				'#e8e2d8',
				'#565975'
			];
			const titles = [
				'SIGNAL BBS - NODE 01',
				"The Sage's Home Page",
				'Welcome to my homepage!',
				'America Online - Chat',
				'YAHOO! Directory',
				'Internet Explorer',
				'FLASH ARCADE',
				'myspace.com',
				'YouTube',
				'The Wizard Forums',
				'Photos / Friends',
				'FOR YOU',
				'New chat +',
				'about:blank'
			];
			rect(0, 0, 320, canvas.height, backgrounds[era]);
			rect(4, 5, 312, 25, era === 0 ? '#bfd09c' : era === 2 ? '#a9a2b9' : '#d8d2c3');
			text(titles[era], 10, 22, '#514b5b', era === 8 ? 17 : 11);
			if (era === 0) {
				text('ATDT 555-0199', 10, 55, '#d6d99c', 13);
				text('CONNECT 2400', 10, 77, '#dac282', 11);
				for (let y = 97; y < canvas.height; y += 5) line(0, y, 320, '#2b473c');
				['[1] READ', '[2] FILES', '[3] CHAT'].forEach((s, i) =>
					text(s, 8, 125 + i * 20, '#b4c992', 9)
				);
				text('C:\\INTERNET> _', 10, 292, '#e8ce91', 12);
			} else if (era === 2) {
				for (let y = 38; y < canvas.height; y += 27)
					for (let x = 3; x < 320; x += 31) rect(x, y, 2, 2, '#c1b1d2');
				img(hello, 6, 90, 64, 32);
				text('MY LINKS', 8, 159, '#ead693', 9);
				text('About me', 8, 180, '#c1b1e0', 8);
				text('Guestbook', 8, 197, '#c1b1e0', 8);
				img(globe, 258, 127, 46, 46);
				text('VISITORS', 249, 219, '#e7d293', 8);
			} else if (era === 8) {
				text('Search videos...', 10, 52, '#877f72', 10);
				line(8, 60, 304, '#b1a794');
				text('wizard trapped in the internet', 9, 81, '#6e665a', 11);
				rect(7, 91, 306, 212, '#aca594');
				rect(11, 95, 298, 194, '#4c5149');
				rect(11, 291, 298, 13, '#d8c8a1');
				text('>  ||     0:00 / 3:01', 16, 302, '#605748', 8);
				text('* * * * *    301 views', 10, 325, '#ac854f', 11);
				text('Related cat videos', 10, 355, '#6b655c', 12);
				img(cat, 12, 372, 76, 58);
				img(cat, 122, 372, 76, 58);
			} else {
				text(
					era === 7
						? 'Home  Browse  Mail  Blog'
						: era === 9
							? 'Board index > Off-topic'
							: 'Back   Home   Favorites',
					9,
					51,
					era === 13 ? '#d9cbe0' : '#6b6871',
					9
				);
				const paper = era === 13 ? '#6b6582' : era === 6 ? '#ebd39e' : '#e7e2d4';
				rect(6, 90, 61, 190, paper);
				rect(254, 90, 60, 190, paper);
				['Home', 'Links', 'Photos', 'Files'].forEach((s, i) =>
					text(s, 11, 111 + i * 24, era === 13 ? '#e1d3db' : '#6e748b', 8)
				);
				img(cat, 261, 103, 46, 37);
				img(cat, 261, 195, 46, 37);
				if (era === 5) rect(0, 307, 320, 19, '#527fb2');
				if (era === 7) text('My Top 8', 253, 158, '#956d84', 9);
				if (era === 12) text('Message the internet...', 15, 312, '#899382', 11);
			}
			tex.needsUpdate = true;
			return;
		}

		rect(0, 0, 640, 400, era === 0 ? '#233e37' : era === 2 ? '#343255' : '#eeeade');
		if (era === 0) {
			for (let y = 0; y < 400; y += 3) rect(0, y, 640, 1, '#29443a');
			rect(12, 12, 616, 27, '#bfd09c');
			text('S I G N A L   B B S     /     NODE 01', 24, 30, '#293f35', 12);
			text('ATDT 555-0199', 25, 62, '#cee0ac', 14);
			text('CONNECT 2400', 25, 82, '#e7c879', 13);
			text('+------------------------------------------+', 25, 109, '#7d9d76');
			[
				'[1] READ MESSAGES',
				'[2] FILE LIBRARY',
				'[3] WHO IS ONLINE',
				'[4] CHAT WITH SYSOP',
				'[5] LOG OFF'
			].forEach((s, i) => text(s, 25, 118 + i * 18, '#b8d09a', 11));
			text('SYSOP: THE SIGNAL SAGE', 25, 224, '#e7c879');
			text('C:\\INTERNET> _', 25, 249, '#e7c879', 14);
			text('NO CARRIER? PLEASE DO NOT', 435, 95, '#b8d09a', 9);
			text('PICK UP THE TELEPHONE.', 435, 110, '#b8d09a', 9);
			text('MODEM STATUS', 448, 268, '#e7c879');
			text('RX   TX   CD   AA', 436, 285, '#b8d09a');
			line(12, 351, 616, '#78936f');
			text('2400 BAUD   8-N-1     PRESS ANY KEY TO EXIST', 25, 375, '#b8d09a', 11);
		} else if (era === 2) {
			for (let y = 0; y < 400; y += 28)
				for (let x = 0; x < 640; x += 29) {
					rect(x + (y % 3) * 3, y, 2, 2, '#c2b6dd');
					if ((x + y) % 5 === 0) {
						rect(x - 2, y + 1, 6, 1, '#ebd4a3');
					}
				}
			rect(6, 6, 628, 22, '#b9b6c6');
			text('Netscape: Welcome to my little corner of the web!', 14, 21, '#373342', 10);
			rect(6, 29, 628, 23, '#d8d4cf');
			text(
				'Back   Forward   Reload    Home     http://www.geocities.com/~sage/',
				14,
				44,
				'#4a4650',
				9
			);
			text('WELCOME TO MY HOMEPAGE', 85, 80, '#f3d894', 23);
			img(hello, 25, 99, 107, 33);
			text('EST. 1996', 487, 81, '#e9d8ed');
			rect(14, 145, 134, 143, '#6e668c');
			text('MY LINKS', 31, 165, '#fff0c7', 12);
			['About me', 'My cat Purl', 'Cool links', 'Sign my guestbook', 'Email me!'].forEach(
				(s, i) => {
					text(s, 25, 192 + i * 19, '#ead9ff', 9);
					line(25, 194 + i * 19, s.length * 5.5, '#c5afe2');
				}
			);
			rect(473, 113, 147, 164, '#555077');
			text('UNDER CONSTRUCTION', 481, 130, '#ffe09b', 10);
			img(globe, 568, 152, 32, 32);
			text('PLEASE COME BACK!', 482, 222, '#eed9aa', 10);
			img(stars, 31, 304, 35, 35);
			img(stars, 577, 302, 35, 35);
			text('YOU ARE VISITOR', 463, 194, '#e8d8f2', 10);

			text('Best viewed with a little imagination.', 165, 379, '#cdbedc', 10);
		} else if (era === 8) {
			rect(0, 0, 640, 30, '#d6d1c6');
			text('Internet Explorer    -    Broadcast Yourself', 12, 20, '#494848', 11);
			rect(0, 31, 640, 30, '#f7f3e8');
			text('You', 15, 53, '#333333', 22);
			rect(54, 34, 54, 24, '#b9554e');
			text('Tube', 58, 53, '#fff7e4', 20);
			rect(148, 38, 216, 14, '#ffffff');
			text('cat doing absolutely nothing', 153, 49, '#88857c', 8);
			rect(370, 38, 44, 14, '#d6d0c6');
			text('Search', 374, 49, '#444444', 8);
			text('Videos   Categories   Channels   Community', 434, 51, '#776354', 7);
			line(8, 64, 624, '#c3b9a6');
			text('wizard gets trapped in the internet (REAL)', 20, 85, '#52473f', 14);
			rect(15, 94, 425, 118, '#a59d8b');
			rect(20, 99, 415, 108, '#4c5149');

			text('Related Videos', 459, 89, '#51463b', 11);
			['cat discovers modem', 'purl vs cardboard', 'keyboard cat???', 'sleeping: part 2'].forEach(
				(s, i) => {
					const y = 106 + i * 64;
					rect(459, y, 72, 48, ['#b5b8a4', '#c2ae93', '#c2b2bf', '#a7baba'][i]);
					img(cat, 468, y + 2, 55, 43);
					text(s, 538, y + 13, '#4c637d', 7);
					text('by purl1998', 538, y + 26, '#817364', 7);
					text('301 views', 538, y + 38, '#817364', 7);
				}
			);
			text('* * * * *', 23, 225, '#bb9143', 18);
			text('301 views', 353, 225, '#7d7264', 10);
			line(15, 237, 425, '#beb5a8');
			text('Comments & Responses', 23, 255, '#62594f', 11);
		} else if (era === 1) {
			rect(0, 0, 640, 400, '#cac8c0');
			text('File   Edit   View   Go   Bookmarks   Help', 12, 19, '#4b4b45', 10);
			line(0, 28, 640, '#77786f');
			c.font = 'bold 26px serif';
			c.fillStyle = '#3a3a35';
			c.fillText("The Sage's Home Page", 18, 69);
			text('Welcome, fellow traveler of the World Wide Web.', 18, 95, '#55534b', 11);
			line(18, 107, 600, '#8c8a82');
			[
				'[ About the author ]',
				'[ My favorite links ]',
				'[ Pictures of my cat ]',
				'[ Download my files ]',
				'[ Sign the guestbook ]'
			].forEach((s, i) => {
				text(s, 20, 138 + i * 22, '#4f5b9c', 11);
				line(20, 141 + i * 22, s.length * 6.5, '#4f5b9c');
			});
			img(cat, 490, 111, 90, 70);
			text('Fig. 1: Purl', 490, 201, '#55534b', 10);
			text('Last updated: yesterday?', 19, 275, '#626056', 10);
			line(18, 289, 600, '#8c8a82');
		} else if (era === 3) {
			rect(0, 0, 640, 400, '#9caec2');
			rect(7, 7, 626, 25, '#426da0');
			text('America Online - People Connection', 16, 25, '#fff1ce', 12);
			rect(7, 34, 626, 31, '#e2ded1');
			text('Mail   People   Channels   Favorites   Sign Off', 19, 54, '#55566c', 12);
			rect(13, 75, 145, 280, '#f0ede0');
			rect(13, 75, 145, 21, '#5579a7');
			text('Buddy List', 23, 90, '#fff0d3', 12);
			[
				'Online (4)',
				'  xX_Sage_Xx',
				'  PurlTheCat',
				'  modem_mom',
				'  away_from_keys',
				'',
				'Offline (38)'
			].forEach((s, i) => text(s, 23, 119 + i * 20, i === 0 ? '#7d8d58' : '#5b5870', 10));
			rect(169, 76, 461, 278, '#eae7d9');
			text('Chat Room: The Internet', 180, 97, '#52618a', 12);
			line(175, 105, 449, '#a2a1ae');
			text('PurlTheCat: mrrp?', 465, 135, '#84749a', 10);
			text('modem_mom: dinner!', 465, 167, '#9b7669', 9);
			text('xX_Sage_Xx is away', 457, 206, '#83886e', 10);
			img(email, 465, 211, 100, 28);
		} else if (era === 4) {
			rect(0, 0, 640, 400, '#f3efdf');
			text('YAHOO!', 19, 42, '#96598c', 29);
			text('YOUR STARTING POINT ON THE WEB', 18, 62, '#7c6a79', 9);
			rect(183, 19, 287, 22, '#fffdfa');
			c.strokeStyle = '#a8a099';
			c.strokeRect(183, 19, 287, 22);
			text('Search the Web', 481, 35, '#716477', 10);
			rect(10, 77, 620, 23, '#cdc2b1');
			text('Directory    News    Finance    Shopping    Weather    Mail', 21, 93, '#5f5973', 11);
			text('Explore the directory', 20, 124, '#8c657e', 12);
			[
				'Arts & Humanities',
				'Business & Economy',
				'Computers & Internet',
				'Entertainment',
				'Games & Recreation'
			].forEach((s, i) => text(s, 20, 152 + i * 19, '#6b7098', 10));
			rect(470, 112, 153, 91, '#e4d9ba');
			text('TODAY: MOSTLY ONLINE', 480, 132, '#797252', 9);
			text('72 F   SUNNY', 491, 155, '#967f49', 12);
			text('Markets: ???', 486, 184, '#876f7c', 10);
			rect(460, 213, 164, 29, '#b9cbb8');
			text('YOUR .COM HERE', 482, 233, '#5d716b', 12);
		} else if (era === 5) {
			rect(0, 0, 640, 400, '#7cb4d5');
			rect(0, 245, 640, 155, '#87ad6b');
			['My Computer', 'Recycle Bin', 'Downloads'].forEach((s, i) => {
				rect(14, 34 + i * 72, 21, 25, '#dbdaca');
				text(s, 11, 73 + i * 72, '#f1edce', 8);
			});
			rect(72, 16, 548, 269, '#e8e4d7');
			rect(72, 16, 548, 25, '#4e7eb9');
			text('Downloads - Microsoft Internet Explorer', 83, 34, '#f7edcf', 12);
			rect(72, 42, 548, 44, '#d8d5c8');
			text('File  Edit  View  Favorites  Tools  Help', 82, 58, '#5f6063', 9);
			text('Address: http://download.more.internet/', 82, 78, '#70746e', 9);
			rect(461, 108, 147, 97, '#f4f0e2');
			text('File Download', 473, 127, '#56769b', 11);
			text('Downloading: cat.zip', 469, 151, '#777162', 9);
			text('Time remaining: 6 years', 469, 175, '#777162', 8);
			rect(0, 286, 640, 23, '#4f7db3');
			rect(0, 286, 54, 23, '#7d9f61');
			text('start', 9, 302, '#f6efdd', 13);
		} else if (era === 6) {
			rect(0, 0, 640, 400, '#d2b780');
			rect(0, 0, 640, 53, '#465170');
			text('FLASH ARCADE', 17, 35, '#edd18b', 25);
			text('GAMES / MOVIES / AUDIO / COMMUNITY', 340, 32, '#c2c6cf', 10);
			rect(18, 69, 140, 229, '#f0dbab');
			text("TODAY'S PICKS", 29, 91, '#6c655e', 12);
			['ORB CLICKER', 'WIZARD GOLF', 'CAT LAUNCHER', 'FROG ESCAPE'].forEach((s, i) => {
				rect(29, 103 + i * 46, 38, 30, ['#9fafb5', '#aa90a9', '#91a587', '#b7a48b'][i]);
				text(s, 73, 122 + i * 46, '#6b5f68', 8);
			});
			rect(171, 69, 289, 185, '#849499');
			text('PLEASE WAIT...', 194, 94, '#dce4cb', 12);
			text('LOADING GAME', 230, 212, '#dce4cb', 11);
			rect(478, 69, 147, 214, '#a68e9b');
			text('HIGH SCORES', 489, 91, '#f3dfab', 13);
			text('1. PURL  999999', 487, 114, '#f4e8cb', 10);
			text('2. SAGE       3', 487, 137, '#f4e8cb', 10);
		} else if (era === 7) {
			rect(0, 0, 640, 400, '#eee7da');
			c.globalAlpha = 0.28;
			for (let y = 67; y < 400; y += 27) for (let x = 3; x < 640; x += 29) img(stars, x, y, 14, 14);
			c.globalAlpha = 1;
			rect(0, 0, 640, 40, '#5379a1');
			text('myspace.com', 19, 27, '#faf0d4', 18);
			text('a place for friends', 158, 26, '#e4d9c8', 10);
			rect(0, 41, 640, 20, '#b4cad8');
			text(
				'Home | Browse | Search | Invite | Mail | Blog | Favorites | Forum',
				18,
				55,
				'#4d6589',
				10
			);
			text('xX The Signal Sage Xx', 17, 85, '#5b526d', 17);
			rect(17, 101, 137, 104, '#baa8b6');
			img(cat, 31, 110, 96, 72);
			text('"brb becoming a wizard"', 18, 225, '#8b6890', 10);
			rect(465, 77, 160, 24, '#dab894');
			text('My Top 8', 480, 94, '#8d5e60', 13);
			for (let i = 0; i < 8; i++) {
				const x = 470 + (i % 4) * 38,
					y = 112 + Math.floor(i / 4) * 59;
				// Portraits occupy dimensional frames in the same page cells.
				text(['Tom', 'Purl', 'frog', 'mom'][i % 4], x, y + 44, '#6a7699', 8);
			}
			text('Interests: magic, HTML, snacks', 170, 264, '#8c7695', 10);
		} else if (era === 9) {
			rect(0, 0, 640, 400, '#c6c8c3');
			rect(8, 9, 624, 32, '#56788f');
			text('THE WIZARD FORUMS', 20, 31, '#efe8ce', 20);
			text('FAQ  Search  Members  Register', 350, 29, '#d2e0da', 10);
			text('Board index > Off-topic > Internet problems', 18, 61, '#636b74', 11);
			for (let n = 0; n < 3; n++) {
				const y = 79 + n * 86;
				rect(12, y, 616, 80, n % 2 ? '#e4e1d5' : '#ebe7dc');
				rect(12, y, 132, 80, '#b4bfca');
				img(cat, 23, y + 21, 37, 30);
				text(['xX_Sage_Xx', 'Purl', 'Administrator'][n], 22, y + 16, '#5a667b', 10);
				text('Posts: 0042', 23, y + 66, '#6d7480', 8);
				rect(156, y + 9, 463, 18, '#cbd1d0');
				text('RE: Help, I live in a webpage now', 164, y + 22, '#65727c', 10);
				text(
					n === 1 ? 'have you tried turning it off and on' : '[ quote ]',
					471,
					y + 53,
					'#7f7990',
					8
				);
			}
		} else if (era === 10) {
			rect(0, 0, 640, 400, '#9eafb9');
			rect(117, 9, 406, 346, '#ede9de');
			rect(117, 9, 406, 30, '#6896b0');
			text('9:41                 100%', 136, 29, '#f3eedc', 10);
			text('Photos', 145, 67, '#77716c', 18);
			text('Friends    Explore', 352, 66, '#7b8993', 10);
			for (let i = 0; i < 3; i++) {
				const x = i === 1 ? 408 : 132,
					y = 86 + i * 66;
				rect(x, y, 100, 57, ['#b9c4ab', '#c7b5b5', '#c7bb99'][i]);
				img(cat, x + 25, y + 5, 50, 43);
				text('purl posted a photo', x, y + 69, '#797c83', 8);
			}
			rect(130, 316, 380, 22, '#d4d0c5');
			text('HOME      SEARCH      CAMERA      PROFILE', 139, 331, '#747a8b', 10);
		} else if (era === 11) {
			rect(0, 0, 640, 400, '#e9e3d8');
			rect(0, 0, 640, 35, '#d2c4bf');
			text('FOR YOU', 23, 25, '#675c76', 18);
			text('Following          Live', 151, 25, '#9a7b8d', 11);
			for (let row = 0; row < 5; row++)
				for (const x of [14, 464]) {
					const y = 51 + row * 81;
					rect(x, y, 162, 73, row % 2 ? '#bec6b5' : '#c6b9bf');
					img(cat, x + 9, y + 4, 67, 52);
					text('another cat video', x + 82, y + 18, '#71667f', 8);
					text('99+ reactions', x + 82, y + 35, '#857587', 7);
					text('because you watched a cat', x + 8, y + 66, '#737b72', 8);
				}
			text('KEEP SCROLLING', 251, 273, '#ac958a', 11);
		} else if (era === 12) {
			rect(0, 0, 640, 400, '#e8e2d8');
			rect(0, 0, 145, 400, '#c9c5bc');
			text('New chat +', 14, 31, '#596960', 14);
			['Today', 'a cat with thumbs', 'another cat', 'please fewer thumbs'].forEach((s, i) =>
				text(s, 13, 66 + i * 26, '#74786b', 9)
			);
			text('SAGE GENERATED CONTENT', 163, 29, '#737d70', 15);
			text('You: make the internet a little nicer', 167, 69, '#8d7788', 11);
			rect(461, 98, 161, 80, '#d3bdce');
			text('Generating...', 474, 118, '#88758d', 11);
			img(cat, 509, 125, 46, 39);
			rect(166, 232, 453, 31, '#fbf7e9');
			text('Message the internet...', 177, 252, '#9e9d8e', 11);
			text('Images may contain extra thumbs.', 164, 286, '#9a9383', 9);
		} else if (era === 13) {
			rect(0, 0, 640, 400, '#565975');
			for (let i = 0; i < 110; i++) {
				const x = (i * 97) % 640,
					y = (i * 41) % 400;
				rect(x, y, i % 6 ? 1 : 3, 1, '#d8c8a6');
			}
			rect(21, 15, 596, 24, '#b9b4c4');
			text('about:blank', 37, 32, '#5d586c', 12);
			text('No more pages.', 35, 102, '#d1c5d7', 18);
			text('You reached the edge of the internet.', 36, 124, '#c1b4ce', 10);
			text('One little signal remains.', 401, 208, '#d3c4cc', 10);
			line(22, 263, 596, '#9990a8');
		}

		tex.needsUpdate = true;
	}
	paint();
	return {
		texture: tex,
		resize() {
			canvas.width = innerWidth < 760 ? 320 : 640;
			canvas.height = Math.round((canvas.width * innerHeight) / innerWidth);
			c.imageSmoothingEnabled = false;
			paint();
		},
		animate(time: number, calm: boolean) {
			const tick = Math.floor(time * 12);
			if (tick === lastFrame && still === calm) return;
			clock = time * 1000;
			still = calm;
			lastFrame = tick;
			paint();
		},
		dispose() {
			disposed = true;
			pictures.forEach((p) => (p.onload = null));
			tex.dispose();
		}
	};
}
