import React, { useState, useEffect } from 'react';
import { useSprings } from 'react-spring/hooks';
import { useGesture } from 'react-with-gesture';
import Footer from '../../Footer';
import styles from './styles.module.css';
import antStyles from './antbtn.module.css';
import leftButton from './left-button.svg';
import rightButton from './right-button.svg';

import CardTextarea from '../CardTextarea';
import Card from '../Card';
import logo from '../../logo.png';

/**
 * Max number of cards on screen
 * @type {number}
 */
const INDEX_ON_SCREEN_THRESHOLD = 10;

// import data from '../../../data.js';

const to = (i, allCount) => {
  return {
    x: 0,
    y: i * -5,
    scale: 1,
    rot: -10 + Math.random() * 20,
    delay: (i - allCount + INDEX_ON_SCREEN_THRESHOLD + 1) * 100,
  };
};
const from = i => ({ rot: 0, scale: 1.5, y: -1000 });

const trans = (r, s) =>
  `perspective(1500px) rotateX(30deg) rotateY(${r /
    10}deg) rotateZ(${r}deg) scale(${s})`;

const Deck = ({ surveys, onSave, isMobile }) => {
  if (!surveys) return null;

  const [gone, setGone] = useState({});

  // Questions array should be revered to look correct. Custom question will be displayed last but goes first in array
  const data = [{ type: 'custom' }].concat(
    (surveys.questions || []).slice().reverse()
  );
  const nonGoneData = data.filter(
    dataItem => gone[dataItem.id] === undefined
  );

  const [springsProps, setSpringsProps] = useSprings(
    data.length,
    i => ({
      ...to(i, data.length),
      from: from(i),
    })
  );

  const bind = useGesture(
    ({
      args: [index],
      down,
      delta: [xDelta],
      distance,
      direction: [xDir],
      velocity,
    }) => {
      const trigger = velocity > 0.2;

      const dir = xDir < 0 ? -1 : 1;

      if (!down && trigger) {
        gone[data[index].id] = dir === 1;
        setGone({
          ...gone,
          [data[index].id]: dir === 1,
        });
      }

      setSpringsProps(i => {
        if (index !== i) return;
        const isGone = gone[data[index].id] !== undefined;

        const x = isGone
          ? (200 + window.innerWidth) * dir
          : down
          ? xDelta
          : 0;

        const rot = xDelta / 100 + dir * 10 * velocity;

        const scale = down ? 1.1 : 1;
        return {
          x,
          rot,
          scale,
          delay: undefined,
          config: {
            friction: 50,
            tension: down ? 800 : isGone ? 200 : 500,
          },
        };
      });

      if (!down && gone.size === data.length)
        setTimeout(
          () => gone.clear() || setSpringsProps(i => to(i)),
          600
        );
    }
  );

  const setYesNoToCard = isYes => e => {
    const dir = isYes ? 1 : -1;
    const currentCardIndex = nonGoneData.length - 1;

    setGone({
      ...gone,
      [data[currentCardIndex].id]: dir === 1,
    });
    setSpringsProps(i => {
      if (currentCardIndex !== i) return;
      return {
        x: (200 + window.innerWidth) * dir,
      };
    });
  };

  const buttonClasses = `${antStyles['ant-btn']} ${antStyles['ant-btn-lg']} ${antStyles['ant-btn-primary']} ${styles.actionButton}`;

  useEffect(() => {
    function onKeyDown(event) {
      if (nonGoneData.length <= 1) {
        return;
      }
      if (event.key === 'ArrowLeft') {
        setYesNoToCard(false)();
      } else if (event.key === 'ArrowRight') {
        setYesNoToCard(true)();
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [nonGoneData]);

  return (
    <div className={styles.container}>
      {surveys.logo && (
        <div className={styles.blockTop}>
          <img
            src={surveys.logo}
            className={styles.brand}
            alt="Logo"
          />
        </div>
      )}

      <div className={styles.blockCenter}>
        <h1
          className={styles.heading}
          style={{
            // Moving title up to make sure cards won't overlap it
            ...(data.length > INDEX_ON_SCREEN_THRESHOLD
              ? { marginBottom: 3 * data.length }
              : {}),
          }}
        >
          {surveys.title}
        </h1>
        {/* > 1 because last item is custom questions, don't need to show yes/no on it */}
        {!isMobile && nonGoneData.length > 1 && (
          <div className={styles.desktopButtonsContainer}>
            <div className={styles.noBtnDesktop}>
              <button
                className={`${buttonClasses} ${antStyles['ant-btn-danger']}`}
                onClick={setYesNoToCard(false)}
              >
                No
              </button>
              <img
                src={leftButton}
                className={styles.buttonImage}
                width="20px"
                height="20px"
                alt="Left button"
              />
            </div>
            <div className={styles.yesBtnDesktop}>
              <button
                className={buttonClasses}
                onClick={setYesNoToCard(true)}
              >
                Yes
              </button>
              <img
                src={rightButton}
                className={styles.buttonImage}
                width="20px"
                height="20px"
                alt="Right button"
              />
            </div>
          </div>
        )}
        <div className={styles.cardsContainer}>
          {springsProps.map(({ x, y, rot, scale }, i) => {
            const { type } = data[i];
            const CardComponent =
              type === 'custom' ? CardTextarea : Card;
            const indexOnScreen = nonGoneData.length - i - 1;
            /*if (indexOnScreen > INDEX_ON_SCREEN_THRESHOLD) {
              return null;
            }*/
            return (
              <CardComponent
                isMobile={isMobile}
                key={i}
                i={i}
                indexOnScreen={indexOnScreen}
                indexOnScreenThreshold={INDEX_ON_SCREEN_THRESHOLD}
                x={x}
                y={y}
                rot={rot}
                scale={scale}
                trans={trans}
                data={data}
                bind={bind}
                gone={gone}
                onSave={onSave}
              />
            );
          })}
        </div>
      </div>
      <div className={styles.blockBottom}>
        <Footer survey={surveys} user={surveys.user} />
      </div>
    </div>
  );
};

export default Deck;
