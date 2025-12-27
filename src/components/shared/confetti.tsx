// Inspired by https://www.w3schools.com/howto/howto_js_confetti.asp
// with modifications for React and Tailwind CSS.
'use client';

import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

const Confetti = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let W = window.innerWidth;
        let H = window.innerHeight;
        canvas.width = W;
        canvas.height = H;

        const mp = 150; // max particles
        const particles: {
            x: number;
            y: number;
            r: number;
            d: number;
            color: string;
            tilt: number;
            tiltAngle: number;
        }[] = [];
        const angle = 0;
        const colors = [
            '#64CCC9', // primary
            '#E29578', // accent
            '#F0EAD6', // background-ish
            '#f9c96c', // gold
            '#a2d2ff', // light blue
        ];

        for (let i = 0; i < mp; i++) {
            particles.push({
                x: Math.random() * W,
                y: Math.random() * H,
                r: Math.random() * 4 + 1, // radius
                d: Math.random() * mp, // density
                color: colors[Math.floor(Math.random() * colors.length)],
                tilt: Math.floor(Math.random() * 10) - 10,
                tiltAngle: 0,
            });
        }

        let animationFrameId: number;
        const draw = () => {
            ctx.clearRect(0, 0, W, H);

            for (let i = 0; i < mp; i++) {
                const p = particles[i];
                ctx.beginPath();
                ctx.lineWidth = p.r;
                ctx.strokeStyle = p.color;
                ctx.moveTo(p.x + p.tilt + p.r / 2, p.y);
                ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
                ctx.stroke();
            }

            update();
            animationFrameId = requestAnimationFrame(draw);
        };

        const update = () => {
            let remainingFlakes = 0;
            for (let i = 0; i < mp; i++) {
                const p = particles[i];
                p.tiltAngle += 0.1;
                p.y += (Math.cos(angle + p.d) + 1 + p.r / 2) / 2;
                p.x += Math.sin(angle);
                p.tilt = Math.sin(p.tiltAngle - i / 3) * 15;

                if (p.y <= H) remainingFlakes++;

                if (p.x > W + 5 || p.x < -5 || p.y > H) {
                    if (i % 5 > 0 || i % 2 === 0) { // re-fall
                        particles[i] = { x: Math.random() * W, y: -10, r: p.r, d: p.d, color: p.color, tilt: p.tilt, tiltAngle: p.tiltAngle };
                    }
                }
            }
            if (remainingFlakes === 0) {
                cancelAnimationFrame(animationFrameId);
            }
        };

        const onResize = () => {
            W = window.innerWidth;
            H = window.innerHeight;
            canvas.width = W;
            canvas.height = H;
        };

        window.addEventListener('resize', onResize);
        
        draw();
        
        return () => {
            window.removeEventListener('resize', onResize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className={cn('fixed top-0 left-0 w-full h-full pointer-events-none z-50')}
        />
    );
};

export default Confetti;
