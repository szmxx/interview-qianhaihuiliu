/**
 * @description:
 * @param {*} time 当前时间
 * @param {*} time 开始属性值
 * @param {*} time 结束属性值
 * @param {*} time 过渡时间
 * @return {*}
 */
function linear(time, begin, end, duration) {
  return begin + (end - begin) * (time / duration)
}
function easeIn(time, begin, end, duration) {
  return begin + (end - begin) * (time /= duration) * time
}
function easeOut(time, begin, end, duration) {
  return -(end - begin) * (time /= duration) * (time - 2) + begin
}
function easeInOut(time, begin, end, duration) {
  // eslint-disable-next-line no-cond-assign
  if ((time /= duration / 2) < 1)
    return ((end - begin) / 2) * time * time + begin

  return (-(end - begin) / 2) * (--time * (time - 2) - 1) + begin
}

function easeInCubic(time, begin, end, duration) {
  return begin + (end - begin) * (time /= duration) * time * time
}
const getAnimationByType = function (type) {
  switch (type) {
    case 'ease-in':
      return easeIn
    case 'ease-out':
      return easeOut
    case 'linear':
      return linear
    case 'ease-in-out':
      return easeInOut
    case 'ease-in-cubic':
      return easeInCubic
  }
}

class LuckyWheel extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
    this.sectors = []
    this.probabilities = []
    this.colors = []
    this.startAngle = 0
    this.isSpinning = false
    this.width = this.getAttribute('width')
    this.height = this.getAttribute('height')
    this.spinType = 'panel'
    const canvas = document.createElement('canvas')
    canvas.width = this.width
    canvas.height = this.height
    canvas.setAttribute('part', 'canvas')
    this.ctx = canvas.getContext('2d')
    this.canvas = canvas
    this.shadowRoot.innerHTML = ''
    this.shadowRoot.appendChild(this.canvas)
    this.addEventListener('click', this.spin)

    setTimeout(() => {
      this.spin()
    }, 2000)
  }

  static get observedAttributes() {
    return ['sectors', 'probabilities', 'start-angle', 'colors']
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      switch (name) {
        case 'sectors':
          this.sectors = JSON.parse(newValue)
          break
        case 'probabilities':
          this.probabilities = JSON.parse(newValue)
          break
        case 'start-angle':
          this.startAngle = Number.parseFloat(newValue)
          break
        case 'colors':
          this.colors = JSON.parse(newValue)
          break
      }
      this.render()
    }
  }

  connectedCallback() {
    this.render()
  }

  render() {
    this.ctx.clearRect(0, 0, this.width, this.height)
    this.drawOuterRing(this.ctx)
    this.drawPerSector(this.ctx, this.sectors)
    this.drawPointer(this.ctx)
  }

  // 绘制外环
  drawOuterRing(ctx, options = {}) {
    // 外环
    const {
      ringColor = 'rgba(238, 169, 74, 1)',
      numCircles = 18,
      circleOddColor = 'rgba(255, 252, 187, 1)',
      circleEvenColor = 'rgba(245, 212, 160, 1)',
    } = options
    const centerX = this.width / 2
    const centerY = this.height / 2
    ctx.save()
    ctx.beginPath()
    ctx.fillStyle = ringColor
    ctx.arc(centerY, centerY, centerX, 0, 2 * Math.PI, false)
    ctx.closePath()
    ctx.fill()
    // 环上圆点
    const angleIncrement = (2 * Math.PI) / numCircles
    const radius = (centerX - 10)
    for (let i = 0; i < numCircles; i++) {
      const angle = i * angleIncrement
      const circleX = centerX + radius * Math.cos(angle)
      const circleY = centerY + radius * Math.sin(angle)
      ctx.beginPath()
      ctx.arc(circleX, circleY, 5, 0, 2 * Math.PI)
      if (i % 2 === 0)
        ctx.fillStyle = circleOddColor

      else
        ctx.fillStyle = circleEvenColor

      ctx.fill()
    }
    ctx.restore()
  }

  // 绘制指针
  drawPointer(ctx, options = {}) {
    const {
      color = 'rgba(255,255,255, 1)',
      radius = 40,
      ringWidth = 8,
      ringColor = 'rgba(72, 72, 72, 1)',
      text = '奖',
      textColor = 'rgb(225, 101, 117)',
    } = options
    const centerX = this.width / 2
    const centerY = this.height / 2
    // 指针旋转角度
    const rotateAngle = this.spinType === 'pointer' ? this.startAngle : 0
    // 绘制外圆
    ctx.save()
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, 0, 360 * Math.PI / 180)
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)'
    ctx.shadowBlur = 10
    ctx.shadowOffsetX = 1
    ctx.shadowOffsetY = 1
    ctx.fill()
    ctx.restore()

    // 绘制内圆
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius - 10, 0, 2 * Math.PI)
    ctx.lineWidth = ringWidth
    ctx.strokeStyle = ringColor
    ctx.stroke()

    // 绘制文字
    ctx.save()
    ctx.translate(centerX, centerY)
    ctx.rotate(rotateAngle)
    ctx.font = '28px Arial'
    ctx.fillStyle = textColor
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, 0, 0)
    ctx.restore()

    // 绘制指针箭头
    const arrowX = centerX + (radius + 12) * Math.cos(rotateAngle)
    const arrowY = centerY + (radius + 12) * Math.sin(rotateAngle)
    ctx.beginPath()
    ctx.moveTo(arrowX, arrowY)
    ctx.arc(arrowX, arrowY, 18, rotateAngle - 140 * (Math.PI / 180), rotateAngle - 220 * (Math.PI / 180), true)
    ctx.fillStyle = color
    ctx.fill()
  }

  // 绘制扇形文字
  drawText(ctx, options = {}) {
    const {
      text = '',
      angle = '',
      textOffset = 85,
      color = '#eee',
      font = '20px Arial',
    } = options
    const centerX = this.width / 2
    const centerY = this.height / 2
    const textX = centerX + textOffset * Math.cos(angle)
    const textY = centerY + textOffset * Math.sin(angle)

    ctx.save()
    ctx.translate(textX, textY)
    ctx.rotate(angle)
    ctx.font = font
    ctx.fillStyle = color
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle' // 设置文字垂直居中对齐
    ctx.fillText(text, 0, 0)
    ctx.restore()
  }

  // 绘制每片扇形
  drawPerSector(ctx, chunks, options = {}) {
    const {
      ringWidth = 10,
      ringColor = 'rgba(0,0,0,0.1)',
    } = options
    const centerX = this.width / 2
    const centerY = this.height / 2
    const totalProbabilities = this.probabilities.reduce((a, b) => a + b, 0)
    // 初始化角度
    let accumulatedAngle = this.spinType === 'panel' ? this.startAngle : 0
    ctx.save()
    const radius = centerX - 20
    chunks.forEach((sector, index) => {
      const sectorAngle = ((360 * this.probabilities[index]) / totalProbabilities) * Math.PI / 180
      const endAngle = accumulatedAngle + sectorAngle
      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.arc(centerY, centerY, radius, accumulatedAngle, endAngle, false)
      ctx.closePath()
      ctx.fillStyle = this.colors[index] // 使用提供的颜色
      ctx.fill()
      if (index % 2 === 0) {
        this.drawText(ctx, {
          text: sector,
          angle: (accumulatedAngle + endAngle) / 2,
          color: 'rgb(255, 255, 255, 1)',
        })
      }
      else {
        this.drawText(ctx, {
          text: sector,
          angle: (accumulatedAngle + endAngle) / 2,
          color: 'rgb(233, 97, 113)',
        })
      }

      accumulatedAngle = endAngle
    })
    // 绘制内圈
    ctx.beginPath()
    ctx.arc(centerY, centerY, radius - ringWidth / 2, 0, 2 * Math.PI)
    ctx.lineWidth = ringWidth
    ctx.strokeStyle = ringColor
    ctx.stroke()
    ctx.restore()
  }

  spin(ctx, options = {}) {
    if (this.isSpinning)
      return

    this.isSpinning = true
    function getRandomInt(min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min
    }
    const {
      time = 0,
      begin = 0,
      type = 'ease-in-out',
      end = getRandomInt(4000 * Math.PI / 180, 40000 * Math.PI / 180),
      duration = 3000,
      callback = (value) => {
        this.startAngle = value
        this.render()
      },
    } = options
    this.play({
      time,
      begin,
      end,
      duration,
      type,
      callback,
    })
  }

  // 启动
  play(options) {
    return new Promise((resolve) => {
      let { time, begin, end, duration, type, callback } = options
      const durNums = Math.ceil(duration / 16.7)
      if (!window.requestAnimationFrame) {
        window.requestAnimationFrame = function (fn) {
          setTimeout(fn, 16.7)
        }
      }
      const step = () => {
        const value = getAnimationByType(type)(time, begin, end, durNums)
        callback(value)
        time++
        if (time <= durNums) {
          window.requestAnimationFrame(step)
        }
        else {
          switch (this.spinType) {
            case 'pointer':
              this.dispatchEvent(new CustomEvent('spinComplete', { detail: this.getPointerSelectedValue() }))
              break
            case 'panel':
              this.dispatchEvent(new CustomEvent('spinComplete', { detail: this.getPanelSelectedValue() }))
              break
          }
          this.isSpinning = false
          resolve()
        }
      }
      step()
    })
  }

  getPanelSelectedValue() {
    const totalProbabilities = this.probabilities.reduce((a, b) => a + b, 0)
    let accumulatedAngle = (this.startAngle / (Math.PI / 180)) % 360
    for (let i = 0; i < this.probabilities.length; i++) {
      const sectorAngle = (360 * this.probabilities[i]) / totalProbabilities
      const endAngle = (accumulatedAngle + sectorAngle)
      if (accumulatedAngle <= 360 && endAngle >= 360)
        return this.sectors[i]
      accumulatedAngle = endAngle
    }
    return this.sectors[0]
  }

  getPointerSelectedValue() {
    const angle = (this.startAngle / (Math.PI / 180)) % 360
    const totalProbabilities = this.probabilities.reduce((a, b) => a + b, 0)
    let accumulatedAngle = 0
    for (let i = 0; i < this.probabilities.length; i++) {
      const sectorAngle = (360 * this.probabilities[i]) / totalProbabilities
      const endAngle = accumulatedAngle + sectorAngle
      if (accumulatedAngle <= angle && angle <= endAngle)
        return this.sectors[i]
      accumulatedAngle = endAngle
    }
    return this.sectors[0]
  }
}

customElements.define('lucky-wheel', LuckyWheel)
